import slugify from 'slugify';
import { Category } from '../models/Category.js';
import { InventoryUnit } from '../models/InventoryUnit.js';
import { Product } from '../models/Product.js';
import { Reservation } from '../models/Reservation.js';
import { Variant } from '../models/Variant.js';
import { ApiError } from '../utils/ApiError.js';
import { withTransaction } from '../utils/withTransaction.js';
import { writeAuditLog } from './audit.service.js';
import { deleteAsset, deleteMany, uploadBuffer } from './upload.service.js';
import { env } from '../config/env.js';

async function writeAdminAudit({ actor, action, entityType, entityId, summary, request, session }) {
  await writeAuditLog({
    actor: actor._id,
    actorRole: actor.role,
    action,
    entityType,
    entityId,
    summary,
    ip: request.ip,
    userAgent: request.userAgent,
    requestId: request.requestId,
    session,
  });
}

function makeSlug(value) {
  const slug = slugify(value, { lower: true, strict: true });
  if (!slug) throw new ApiError(400, 'Name must contain letters or numbers to create a URL slug');
  return slug;
}

/**
 * Creates a catalog product and its audit entry atomically.
 */
export async function createProduct({ actor, input, request }) {
  return withTransaction(async (session) => {
    const category = await Category.findOne({ _id: input.category, isActive: true }).session(session).exec();
    if (!category) throw new ApiError(400, 'An active category is required');
    const [product] = await Product.create(
      [{ ...input, slug: makeSlug(input.title) }],
      { session }
    );
    await writeAdminAudit({
      actor,
      action: 'product.created',
      entityType: 'Product',
      entityId: product._id,
      summary: { title: product.title, status: product.status },
      request,
      session,
    });
    return product.toJSON();
  });
}

/**
 * Updates an existing product, regenerating its URL slug when the title changes.
 */
export async function updateProduct({ productId, actor, input, request }) {
  return withTransaction(async (session) => {
    const product = await Product.findById(productId).session(session).exec();
    if (!product) throw new ApiError(404, 'Product not found');
    if (input.status === 'published') {
      if ((input.images ?? product.images).length === 0) {
        throw new ApiError(409, 'Add at least one product image before publishing');
      }
      const activeVariants = await Variant.find({
        product: product._id,
        isActive: true,
      }).select('_id').session(session).lean().exec();
      if (activeVariants.length === 0) {
        throw new ApiError(409, 'Add at least one active size variant before publishing');
      }
      const availableUnits = await InventoryUnit.countDocuments({
        product: product._id,
        variant: { $in: activeVariants.map(({ _id }) => _id) },
        status: 'available',
      }).session(session).exec();
      if (availableUnits === 0) {
        throw new ApiError(409, 'Add at least one available inventory unit before publishing');
      }
    }
    if (input.pricing) Object.assign(product.pricing, input.pricing);
    const updates = { ...input };
    delete updates.pricing;
    Object.assign(product, updates);
    if (input.category) {
      const category = await Category.findOne({ _id: input.category, isActive: true }).session(session).exec();
      if (!category) throw new ApiError(400, 'An active category is required');
    }
    if (input.title) product.slug = makeSlug(input.title);
    await product.save({ session });
    await writeAdminAudit({
      actor,
      action: 'product.updated',
      entityType: 'Product',
      entityId: product._id,
      summary: { fields: Object.keys(input) },
      request,
      session,
    });
    return product.toJSON();
  });
}

/**
 * Uploads and attaches product images, compensating Cloudinary uploads on database failure.
 */
export async function addProductImages({ productId, actor, files, request }) {
  if (files.length === 0) throw new ApiError(400, 'At least one image is required', 'UPLOAD_FILE_REQUIRED');
  const currentCount = await Product.findOne({ _id: productId, deletedAt: null })
    .select('images')
    .lean()
    .exec();
  if (!currentCount) throw new ApiError(404, 'Product not found');
  if (currentCount.images.length + files.length > 8) {
    throw new ApiError(409, 'A product can have at most 8 images', 'IMAGE_LIMIT_EXCEEDED');
  }

  const uploaded = [];
  try {
    for (const file of files) {
      uploaded.push(await uploadBuffer(file.buffer, {
        folder: `${env.CLOUDINARY_FOLDER}/products/${productId}`,
        publicIdPrefix: 'product',
      }));
    }

    return await withTransaction(async (session) => {
      const product = await Product.findOne({ _id: productId, deletedAt: null }).session(session).exec();
      if (!product) throw new ApiError(404, 'Product not found');
      if (product.images.length + uploaded.length > 8) {
        throw new ApiError(409, 'A product can have at most 8 images', 'IMAGE_LIMIT_EXCEEDED');
      }
      const isPrimary = product.images.length === 0;
      product.images.push(...uploaded.map((image, index) => ({
        ...image,
        isPrimary: isPrimary && index === 0,
        sortOrder: product.images.length + index,
      })));
      await product.save({ session });
      await writeAdminAudit({
        actor,
        action: 'product.images_added',
        entityType: 'Product',
        entityId: product._id,
        summary: { imageCount: uploaded.length },
        request,
        session,
      });
      return product.toJSON();
    });
  } catch (error) {
    await deleteMany(uploaded.map((image) => image.publicId));
    throw error;
  }
}

/**
 * Reorders every product image and sets exactly one primary image.
 */
export async function reorderProductImages({ productId, publicIds, primaryPublicId, actor, request }) {
  return withTransaction(async (session) => {
    const product = await Product.findOne({ _id: productId, deletedAt: null }).session(session).exec();
    if (!product) throw new ApiError(404, 'Product not found');
    const existingIds = product.images.map((image) => image.publicId);
    if (
      publicIds.length !== existingIds.length ||
      new Set(publicIds).size !== publicIds.length ||
      publicIds.some((publicId) => !existingIds.includes(publicId)) ||
      !existingIds.includes(primaryPublicId)
    ) {
      throw new ApiError(400, 'Image order must include every product image exactly once and select a primary image');
    }
    product.images.sort((left, right) =>
      publicIds.indexOf(left.publicId) - publicIds.indexOf(right.publicId)
    );
    product.images.forEach((image, index) => {
      image.sortOrder = index;
      image.isPrimary = image.publicId === primaryPublicId;
    });
    await product.save({ session });
    await writeAdminAudit({
      actor,
      action: 'product.images_reordered',
      entityType: 'Product',
      entityId: product._id,
      summary: { imageCount: product.images.length },
      request,
      session,
    });
    return product.toJSON();
  });
}

/**
 * Removes a product image from MongoDB and best-effort deletes its Cloudinary asset.
 */
export async function removeProductImage({ productId, publicId, actor, request }) {
  const removed = await withTransaction(async (session) => {
    const product = await Product.findOne({ _id: productId, deletedAt: null }).session(session).exec();
    if (!product) throw new ApiError(404, 'Product not found');
    const image = product.images.find((entry) => entry.publicId === publicId);
    if (!image) throw new ApiError(404, 'Product image not found');
    if (product.status === 'published' && product.images.length === 1) {
      throw new ApiError(409, 'A published product must retain at least one image');
    }
    product.images = product.images.filter((entry) => entry.publicId !== publicId);
    product.images.forEach((entry, index) => {
      entry.sortOrder = index;
      entry.isPrimary = index === 0;
    });
    await product.save({ session });
    await writeAdminAudit({
      actor,
      action: 'product.image_removed',
      entityType: 'Product',
      entityId: product._id,
      summary: { publicId },
      request,
      session,
    });
    return { product: product.toJSON(), publicId };
  });
  await deleteAsset(removed.publicId);
  return removed.product;
}

/**
 * Archives a product without deleting historical booking references.
 */
export async function archiveProduct({ productId, actor, request }) {
  return withTransaction(async (session) => {
    const product = await Product.findById(productId).session(session).exec();
    if (!product) throw new ApiError(404, 'Product not found');
    product.status = 'archived';
    product.deletedAt = new Date();
    await product.save({ session });
    await writeAdminAudit({
      actor,
      action: 'product.archived',
      entityType: 'Product',
      entityId: product._id,
      summary: { title: product.title },
      request,
      session,
    });
    return product.toJSON();
  });
}

/**
 * Creates a category with a generated slug and an audit entry.
 */
export async function createCategory({ actor, input, request }) {
  return withTransaction(async (session) => {
    if (input.parent) {
      const parent = await Category.findOne({ _id: input.parent, isActive: true }).session(session).exec();
      if (!parent) throw new ApiError(400, 'Parent category was not found or is inactive');
    }
    const [category] = await Category.create(
      [{ ...input, slug: makeSlug(input.name) }],
      { session }
    );
    await writeAdminAudit({
      actor,
      action: 'category.created',
      entityType: 'Category',
      entityId: category._id,
      summary: { name: category.name },
      request,
      session,
    });
    return category.toJSON();
  });
}

/**
 * Updates a category and prevents its parent chain from forming a cycle.
 */
export async function updateCategory({ categoryId, actor, input, request }) {
  return withTransaction(async (session) => {
    const category = await Category.findById(categoryId).session(session).exec();
    if (!category) throw new ApiError(404, 'Category not found');
    if (input.parent) {
      let parentId = input.parent;
      const visited = new Set();
      while (parentId) {
        const key = String(parentId);
        if (key === String(category._id) || visited.has(key)) {
          throw new ApiError(400, 'Category hierarchy cannot contain a cycle');
        }
        visited.add(key);
        const parent = await Category.findOne({ _id: parentId, isActive: true })
          .select('parent')
          .session(session)
          .lean()
          .exec();
        if (!parent) throw new ApiError(400, 'Parent category was not found or is inactive');
        parentId = parent.parent;
      }
    }
    Object.assign(category, input);
    if (input.name) category.slug = makeSlug(input.name);
    await category.save({ session });
    await writeAdminAudit({
      actor,
      action: 'category.updated',
      entityType: 'Category',
      entityId: category._id,
      summary: { fields: Object.keys(input) },
      request,
      session,
    });
    return category.toJSON();
  });
}

/**
 * Creates one size/color variant and its physical inventory units atomically.
 */
export async function createVariant({ productId, actor, input, request }) {
  return withTransaction(async (session) => {
    const product = await Product.findOne({ _id: productId, deletedAt: null }).session(session).exec();
    if (!product) throw new ApiError(404, 'Product not found');
    if (product.status === 'archived') throw new ApiError(409, 'Archived products cannot receive new variants');
    const [variant] = await Variant.create(
      [{ product: product._id, sku: input.sku, size: input.size, color: input.color }],
      { session }
    );
    const units = await InventoryUnit.insertMany(
      input.unitCodes.map((unitCode) => ({
        product: product._id,
        variant: variant._id,
        unitCode,
      })),
      { session }
    );
    await writeAdminAudit({
      actor,
      action: 'inventory.variant_created',
      entityType: 'Variant',
      entityId: variant._id,
      summary: { productId: String(product._id), sku: variant.sku, unitCount: units.length },
      request,
      session,
    });
    return { variant: variant.toJSON(), units: units.map((unit) => unit.toJSON()) };
  });
}

/**
 * Changes an available or maintenance unit to maintenance, available, or retired.
 */
export async function updateInventoryStatus({ unitId, status, actor, request }) {
  return withTransaction(async (session) => {
    const unit = await InventoryUnit.findById(unitId).session(session).exec();
    if (!unit) throw new ApiError(404, 'Inventory unit not found');
    if (!['available', 'maintenance'].includes(unit.status)) {
      throw new ApiError(409, 'Only available or maintenance units can be changed here');
    }
    const reservation = await Reservation.exists({
      unit: unit._id,
      status: { $in: ['held', 'confirmed', 'active'] },
    }).session(session);
    if (reservation) throw new ApiError(409, 'Unit has an active reservation');
    const previousStatus = unit.status;
    unit.status = status;
    await unit.save({ session });
    await writeAdminAudit({
      actor,
      action: 'inventory.unit_status_updated',
      entityType: 'InventoryUnit',
      entityId: unit._id,
      summary: { before: previousStatus, after: status },
      request,
      session,
    });
    return unit.toJSON();
  });
}
