import { Variant } from '../models/Variant.js';
import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';
import { Wishlist } from '../models/Wishlist.js';
import { ServiceablePincode } from '../models/ServiceablePincode.js';
import { getAvailabilityCount, getAvailableProductIds, getBlockedDateRanges } from './availability.service.js';
import { ApiError } from '../utils/ApiError.js';

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
let cachedCategories;
let categoriesCacheExpiresAt = 0;

/**
 * Returns active categories ordered for catalog navigation.
 */
export async function listActiveCategories() {
  if (cachedCategories && Date.now() < categoriesCacheExpiresAt) return cachedCategories;
  const categories = await Category.find({ isActive: true })
    .sort({ parent: 1, sortOrder: 1, name: 1 })
    .lean()
    .exec();
  const nodes = new Map(categories.map((category) => [
    String(category._id),
    { ...category, children: [] },
  ]));
  const tree = [];
  for (const category of categories) {
    const node = nodes.get(String(category._id));
    const parent = category.parent ? nodes.get(String(category.parent)) : null;
    if (parent) parent.children.push(node);
    else tree.push(node);
  }
  cachedCategories = tree;
  categoriesCacheExpiresAt = Date.now() + 5 * 60_000;
  return tree;
}

/**
 * Returns a filtered and paginated list of published products.
 */
export async function listPublishedProducts({
  page = 1,
  limit = 20,
  category,
  search,
  q,
  occasion,
  gender,
  size,
  color,
  brand,
  minPrice,
  maxPrice,
  available,
  startDate,
  endDate,
  userId,
  sort = 'newest',
}) {
  const filter = { status: 'published', deletedAt: null };
  if (category) filter.category = category;
  if (occasion) filter.occasions = occasion;
  if (gender) filter.gender = gender;
  if (color) filter.colors = new RegExp(`^${escapeRegex(color)}$`, 'i');
  if (brand) filter.brand = new RegExp(`^${escapeRegex(brand)}$`, 'i');
  if (search || q) filter.$text = { $search: search ?? q };
  if (minPrice != null || maxPrice != null) {
    filter['pricing.basePrice'] = {};
    if (minPrice != null) filter['pricing.basePrice'].$gte = minPrice;
    if (maxPrice != null) filter['pricing.basePrice'].$lte = maxPrice;
  }
  if (size) {
    const productIds = await Variant.distinct('product', {
      size: new RegExp(`^${escapeRegex(size)}$`, 'i'),
      isActive: true,
    }).exec();
    filter._id = { $in: productIds };
  }

  const sortBy = {
    newest: { createdAt: -1 },
    price_asc: { 'pricing.basePrice': 1, _id: 1 },
    price_desc: { 'pricing.basePrice': -1, _id: 1 },
    featured: { isFeatured: -1, createdAt: -1 },
    popular: { rentCount: -1, ratingAvg: -1, _id: 1 },
    rating: { ratingAvg: -1, ratingCount: -1 },
  }[sort];

  let items;
  let total;
  let facets;
  if (available) {
    const cursor = Product.find(filter)
      .populate({ path: 'category', select: 'name slug' })
      .sort(sortBy)
      .lean()
      .cursor();
    const pageStart = (page - 1) * limit;
    const pageEnd = pageStart + limit;
    const batchSize = 100;
    const facetCounts = new Map(
      ['categories', 'genders', 'occasions', 'brands', 'colors']
        .map((field) => [field, new Map()])
    );
    const sizeProducts = new Map();
    items = [];
    total = 0;
    let batch = [];

    const countValues = (field, values) => {
      for (const value of new Set(values.filter(Boolean).map(String))) {
        const counts = facetCounts.get(field);
        counts.set(value, (counts.get(value) ?? 0) + 1);
      }
    };
    const flushBatch = async () => {
      if (batch.length === 0) return;
      const availableIds = new Set(await getAvailableProductIds(batch, startDate, endDate));
      const matched = batch.filter((product) => availableIds.has(String(product._id)));
      const matchStart = total;
      total += matched.length;
      const localStart = Math.max(0, pageStart - matchStart);
      const localEnd = Math.max(localStart, Math.min(matched.length, pageEnd - matchStart));
      items.push(...matched.slice(localStart, localEnd));

      for (const product of matched) {
        countValues('categories', [product.category?.name]);
        countValues('genders', [product.gender]);
        countValues('occasions', product.occasions ?? []);
        countValues('brands', [product.brand]);
        countValues('colors', product.colors ?? []);
      }
      const variants = matched.length
        ? await Variant.find({ product: { $in: matched.map(({ _id }) => _id) }, isActive: true })
          .select('product size')
          .lean()
          .exec()
        : [];
      for (const variant of variants) {
        if (!sizeProducts.has(variant.size)) sizeProducts.set(variant.size, new Set());
        sizeProducts.get(variant.size).add(String(variant.product));
      }
      batch = [];
    };

    try {
      for await (const product of cursor) {
        batch.push(product);
        if (batch.length >= batchSize) await flushBatch();
      }
      await flushBatch();
    } finally {
      await cursor.close();
    }

    facets = {
      ...Object.fromEntries(
        [...facetCounts].map(([field, values]) => [
          field,
          [...values].map(([value, count]) => ({ value, count })),
        ])
      ),
      sizes: [...sizeProducts].map(([value, products]) => ({ value, count: products.size })),
    };
  } else {
    const [pageProducts, count, facetRows] = await Promise.all([
      Product.find(filter)
        .populate({ path: 'category', select: 'name slug' })
        .sort(sortBy)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      Product.countDocuments(filter).exec(),
      Product.aggregate([
        { $match: filter },
        {
          $lookup: {
            from: Category.collection.name,
            localField: 'category',
            foreignField: '_id',
            as: 'categoryData',
          },
        },
        { $unwind: { path: '$categoryData', preserveNullAndEmptyArrays: true } },
        {
          $facet: {
            categories: [
              { $group: { _id: '$categoryData.name', count: { $sum: 1 } } },
              { $match: { _id: { $ne: null } } },
              { $project: { _id: 0, value: '$_id', count: 1 } },
            ],
            genders: [
              { $group: { _id: '$gender', count: { $sum: 1 } } },
              { $match: { _id: { $ne: null } } },
              { $project: { _id: 0, value: '$_id', count: 1 } },
            ],
            occasions: [
              { $unwind: '$occasions' },
              { $group: { _id: '$occasions', count: { $sum: 1 } } },
              { $project: { _id: 0, value: '$_id', count: 1 } },
            ],
            brands: [
              { $group: { _id: '$brand', count: { $sum: 1 } } },
              { $match: { _id: { $ne: null } } },
              { $project: { _id: 0, value: '$_id', count: 1 } },
            ],
            colors: [
              { $unwind: '$colors' },
              { $group: { _id: '$colors', count: { $sum: 1 } } },
              { $project: { _id: 0, value: '$_id', count: 1 } },
            ],
            sizes: [
              {
                $lookup: {
                  from: Variant.collection.name,
                  let: { productId: '$_id' },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $and: [
                            { $eq: ['$product', '$$productId'] },
                            { $eq: ['$isActive', true] },
                          ],
                        },
                      },
                    },
                    { $project: { size: 1 } },
                  ],
                  as: 'activeVariants',
                },
              },
              { $unwind: '$activeVariants' },
              {
                $group: {
                  _id: '$activeVariants.size',
                  products: { $addToSet: '$_id' },
                },
              },
              { $project: { _id: 0, value: '$_id', count: { $size: '$products' } } },
            ],
          },
        },
      ]).exec(),
    ]);
    items = pageProducts;
    total = count;
    facets = facetRows[0] ?? {
      categories: [],
      genders: [],
      occasions: [],
      brands: [],
      colors: [],
      sizes: [],
    };
  }

  const wishlist = userId
    ? await Wishlist.findOne({ user: userId }).select('products').lean().exec()
    : null;
  const wishlisted = new Set((wishlist?.products ?? []).map(String));

  return {
    items: items.map((product) => ({
      ...product,
      primaryImage: product.images.find((image) => image.isPrimary) ?? product.images[0] ?? null,
      price: product.pricing.basePrice,
      isWishlisted: wishlisted.has(String(product._id)),
    })),
    meta: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      facets,
    },
  };
}

/**
 * Returns bounded, read-only product details for static storefront generation.
 */
export async function listPrerenderProducts({ page = 1, limit = 100 } = {}) {
  const filter = { status: 'published', deletedAt: null };
  const [total, products] = await Promise.all([
    Product.countDocuments(filter).exec(),
    Product.find(filter)
      .select(
        '_id title slug description brand occasions tags colors fabric careInstructions fitNotes images pricing ratingAvg ratingCount isFeatured'
      )
      .sort({ isFeatured: -1, createdAt: -1, _id: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()
      .exec(),
  ]);
  const variants = products.length
    ? await Variant.find({ product: { $in: products.map(({ _id }) => _id) } })
      .select('_id product size color isActive')
      .sort({ size: 1, color: 1 })
      .lean()
      .exec()
    : [];
  const variantsByProduct = new Map();
  for (const variant of variants) {
    const productId = String(variant.product);
    const productVariants = variantsByProduct.get(productId) ?? [];
    productVariants.push({
      _id: variant._id,
      size: variant.size,
      color: variant.color,
      active: variant.isActive,
    });
    variantsByProduct.set(productId, productVariants);
  }

  return {
    items: products.map((product) => ({
      ...product,
      variants: variantsByProduct.get(String(product._id)) ?? [],
      ratingSummary: {
        average: product.ratingAvg ?? 0,
        count: product.ratingCount ?? 0,
      },
    })),
    meta: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

/**
 * Looks up a published, non-deleted product by its slug.
 */
export async function getProductBySlug(slug) {
  const isObjectId = /^[a-f\d]{24}$/i.test(slug);
  const productFilter = isObjectId
    ? { $or: [{ slug }, { _id: slug }], status: 'published', deletedAt: null }
    : { slug, status: 'published', deletedAt: null };
  const product = await Product.findOne(productFilter)
    .populate({ path: 'category', select: 'name slug' })
    .lean()
    .exec();
  if (!product) return null;
  const variants = await Variant.find({ product: product._id })
    .sort({ size: 1, color: 1 })
    .lean()
    .exec();
  await Product.updateOne({ _id: product._id }, { $inc: { viewCount: 1 } }).exec();
  return {
    ...product,
    variants: variants.map((variant) => ({ ...variant, active: variant.isActive })),
    ratingSummary: { average: product.ratingAvg, count: product.ratingCount },
  };
}

/**
 * Returns published products related by category and at least one shared occasion.
 */
export async function listSimilarProducts(slug, { limit = 8 } = {}) {
  const isObjectId = /^[a-f\d]{24}$/i.test(slug);
  const productFilter = isObjectId
    ? { $or: [{ slug }, { _id: slug }], status: 'published', deletedAt: null }
    : { slug, status: 'published', deletedAt: null };
  const product = await Product.findOne(productFilter)
    .select('_id category occasions')
    .lean()
    .exec();
  if (!product) throw new ApiError(404, 'Product not found');
  const similarFilter = {
    _id: { $ne: product._id },
    category: product.category,
    status: 'published',
    deletedAt: null,
  };
  if (product.occasions.length) similarFilter.occasions = { $in: product.occasions };
  return Product.find(similarFilter)
    .sort({ ratingAvg: -1, rentCount: -1 })
    .limit(limit)
    .lean()
    .exec();
}

/**
 * Returns serviceability and delivery estimate for a six-digit pincode.
 */
export async function getPincodeServiceability(pincode) {
  const service = await ServiceablePincode.findOne({ pincode, isActive: true })
    .select('-_id pincode city state deliveryDays')
    .lean()
    .exec();
  return service
    ? { serviceable: true, ...service, estimatedDeliveryDays: service.deliveryDays }
    : { serviceable: false, pincode, estimatedDeliveryDays: null };
}

/**
 * Returns blocked ranges and optional date-specific availability for a product variant.
 */
export async function getSlugAvailability(slug, {
  variantId,
  from,
  to,
  startDate,
  endDate,
}) {
  const isObjectId = /^[a-f\d]{24}$/i.test(slug);
  const filter = isObjectId
    ? { $or: [{ slug }, { _id: slug }], status: 'published', deletedAt: null }
    : { slug, status: 'published', deletedAt: null };
  const product = await Product.findOne(filter)
    .select('_id')
    .lean()
    .exec();
  if (!product) throw new ApiError(404, 'Product not found');
  const variant = await Variant.findOne({
    _id: variantId,
    product: product._id,
    isActive: true,
  }).select('_id').lean().exec();
  if (!variant) throw new ApiError(404, 'Product variant not found');

  const blockedDates = await getBlockedDateRanges(product._id, variantId, from, to);
  const result = { blockedDates };
  if (startDate && endDate) {
    const availableCount = await getAvailabilityCount(variantId, startDate, endDate);
    result.availableCount = Math.min(availableCount, 2);
    result.available = availableCount > 0;
  }
  return result;
}
