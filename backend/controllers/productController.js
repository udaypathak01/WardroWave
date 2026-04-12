const { getDB } = require('../config/firebase');
const COLLECTIONS = require('../config/collections');
const { asyncHandler } = require('../middleware/errorHandler');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const docToObj = (doc) => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    image: data.images && data.images.length > 0 ? data.images[0].url : 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=500&h=600&fit=crop',
    reviews: data.reviewCount || 0,
    price: data.originalPrice || 0,
    rented: data.totalRentals || 0,
    earnings: data.totalEarnings || 0,
    savings: data.originalPrice ? Math.round(((data.originalPrice - data.rentalPrice) / data.originalPrice) * 100) : 0
  };
};

const buildProductQuery = (db) => {
  return db.collection(COLLECTIONS.PRODUCTS).where('isActive', '==', true);
};

// ─── GET /api/products ────────────────────────────────────────────────────────

const getProducts = asyncHandler(async (req, res) => {
  const db = getDB();
  const { category, inStock, minPrice, maxPrice, sort = 'createdAt', search, limit = '100', page = '1' } = req.query;

  let query = buildProductQuery(db);

  // Sorting
  const sortMap = {
    'price-asc': ['rentalPrice', 'asc'],
    'price-desc': ['rentalPrice', 'desc'],
    'rating': ['rating', 'desc'],
    'newest': ['createdAt', 'desc'],
    'popular': ['totalRentals', 'desc'],
    'createdAt': ['createdAt', 'desc'],
  };
  const [sortField, sortDir] = sortMap[sort] || ['createdAt', 'desc'];

  // Pagination via Firestore limit
  const limitNum = Math.min(200, Math.max(1, parseInt(limit)));
  const pageNum = Math.max(1, parseInt(page));

  // For proper pagination we'd need cursor-based, but we'll use limit+offset approach
  const allSnaps = await query.get();
  let products = allSnaps.docs.map(docToObj);

  // Client-side generic filtering
  if (category && category !== 'all') products = products.filter(p => p.category === category.toLowerCase());
  if (inStock === 'true') products = products.filter(p => p.inStock === true);
  if (minPrice) products = products.filter(p => p.rentalPrice >= parseFloat(minPrice));
  if (maxPrice) products = products.filter(p => p.rentalPrice <= parseFloat(maxPrice));
  products.sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];
    if (typeof valA === 'string') { valA = valA.toLowerCase(); valB = valB.toLowerCase(); }
    if (sortDir === 'desc') {
      return valA > valB ? -1 : valA < valB ? 1 : 0;
    }
    return valA > valB ? 1 : valA < valB ? -1 : 0;
  });

  // Client-side filtering for price range (Firestore can't do range on two fields simultaneously)
  if (minPrice) products = products.filter(p => p.rentalPrice >= parseFloat(minPrice));
  if (maxPrice) products = products.filter(p => p.rentalPrice <= parseFloat(maxPrice));

  // Client-side text search
  if (search?.trim()) {
    const q = search.trim().toLowerCase();
    products = products.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.tags?.some(t => t.toLowerCase().includes(q))
    );
  }

  const total = products.length;
  const start = (pageNum - 1) * limitNum;
  const paginated = products.slice(start, start + limitNum);

  res.status(200).json({
    success: true,
    data: {
      products: paginated,
      pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum), hasMore: start + limitNum < total },
    },
  });
});

// ─── GET /api/products/featured ───────────────────────────────────────────────

const getFeaturedProducts = asyncHandler(async (req, res) => {
  const db = getDB();
  const snap = await db.collection(COLLECTIONS.PRODUCTS)
    .where('isActive', '==', true)
    .get();

  const all = snap.docs.map(docToObj);

  // Primary: high-rated in-stock products
  let products = all
    .filter(p => p.inStock === true && p.rating >= 4.5)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 8);

  // Fallback: if fewer than 4 qualify (e.g. fresh DB), pad with newest in-stock products
  if (products.length < 4) {
    const existing = new Set(products.map(p => p.id));
    const fallback = all
      .filter(p => p.inStock !== false && !existing.has(p.id))
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 8 - products.length);
    products = [...products, ...fallback];
  }

  res.status(200).json({ success: true, data: { products } });
});


// ─── GET /api/products/categories ─────────────────────────────────────────────

const getCategories = asyncHandler(async (req, res) => {
  const db = getDB();
  const snap = await db.collection(COLLECTIONS.PRODUCTS).where('isActive', '==', true).get();

  const counts = {};
  snap.docs.forEach(doc => {
    const cat = doc.data().category;
    counts[cat] = (counts[cat] || 0) + 1;
  });

  const categories = Object.entries(counts).map(([name, count]) => ({ name, count }));
  res.status(200).json({ success: true, data: { categories } });
});

// ─── GET /api/products/:id ────────────────────────────────────────────────────

const getProductById = asyncHandler(async (req, res) => {
  const db = getDB();
  const doc = await db.collection(COLLECTIONS.PRODUCTS).doc(req.params.id).get();

  if (!doc.exists || !doc.data().isActive) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  const product = docToObj(doc);

  // Related products
  const relatedSnap = await db.collection(COLLECTIONS.PRODUCTS)
    .where('isActive', '==', true)
    .get();

  const related = relatedSnap.docs
    .map(docToObj)
    .filter(p => p.id !== product.id && p.category === product.category)
    .slice(0, 4);

  res.status(200).json({ success: true, data: { product, related } });
});

// ─── POST /api/products ───────────────────────────────────────────────────────

const createProduct = asyncHandler(async (req, res) => {
  const db = getDB();
  const { v4: uuidv4 } = require('uuid');

  const { name, description, rentalPrice, originalPrice, category, subcategory, duration, sizes, colors, tags, images } = req.body;

  if (!name || !rentalPrice || !originalPrice || !category) {
    return res.status(400).json({ success: false, message: 'Name, prices, and category are required' });
  }

  const productData = {
    name: name.trim(),
    description: description?.trim() || '',
    rentalPrice: parseFloat(rentalPrice),
    originalPrice: parseFloat(originalPrice),
    category: category.toLowerCase(),
    subcategory: subcategory?.toLowerCase() || '',
    duration: parseInt(duration) || 3,
    sizes: Array.isArray(sizes) ? sizes : [],
    colors: Array.isArray(colors) ? colors : [],
    tags: Array.isArray(tags) ? tags : [],
    images: Array.isArray(images) ? images : [], // [{ url, isPrimary }]
    inStock: true,
    stockQuantity: 1,
    rating: 0,
    reviewCount: 0,
    reviews: [],
    totalRentals: 0,
    totalEarnings: 0,
    qrCode: `WW-${uuidv4().split('-')[0].toUpperCase()}`,
    owner: 'WardroWave',
    ownerName: 'WardroWave',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const docRef = await db.collection(COLLECTIONS.PRODUCTS).add(productData);

  res.status(201).json({ success: true, message: 'Product listed', data: { product: { id: docRef.id, ...productData } } });
});

// ─── PUT /api/products/:id ────────────────────────────────────────────────────

const updateProduct = asyncHandler(async (req, res) => {
  const db = getDB();
  const doc = await db.collection(COLLECTIONS.PRODUCTS).doc(req.params.id).get();

  if (!doc.exists) return res.status(404).json({ success: false, message: 'Product not found' });

  const product = doc.data();
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized to update this product' });
  }

  const allowed = ['name', 'description', 'rentalPrice', 'originalPrice', 'category', 'subcategory', 'duration', 'sizes', 'colors', 'tags', 'inStock', 'stockQuantity', 'images'];
  const updates = { updatedAt: new Date().toISOString() };
  allowed.forEach(field => { if (req.body[field] !== undefined) updates[field] = req.body[field]; });

  await db.collection(COLLECTIONS.PRODUCTS).doc(req.params.id).update(updates);
  res.status(200).json({ success: true, message: 'Product updated', data: { product: { id: req.params.id, ...product, ...updates } } });
});

// ─── DELETE /api/products/:id ─────────────────────────────────────────────────

const deleteProduct = asyncHandler(async (req, res) => {
  const db = getDB();
  const doc = await db.collection(COLLECTIONS.PRODUCTS).doc(req.params.id).get();

  if (!doc.exists) return res.status(404).json({ success: false, message: 'Product not found' });

  const product = doc.data();
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  // Soft delete
  await db.collection(COLLECTIONS.PRODUCTS).doc(req.params.id).update({ isActive: false, updatedAt: new Date().toISOString() });
  res.status(200).json({ success: true, message: 'Product removed' });
});

// ─── POST /api/products/:id/review ────────────────────────────────────────────

const addReview = asyncHandler(async (req, res) => {
  const db = getDB();
  const { rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, message: 'Rating must be 1–5' });
  }

  const productRef = db.collection(COLLECTIONS.PRODUCTS).doc(req.params.id);
  const doc = await productRef.get();

  if (!doc.exists) return res.status(404).json({ success: false, message: 'Product not found' });

  const product = doc.data();
  const reviews = product.reviews || [];

  const alreadyReviewed = reviews.find(r => r.uid === req.user.uid);
  if (alreadyReviewed) {
    return res.status(409).json({ success: false, message: 'You have already reviewed this product' });
  }

  const newReview = {
    uid: req.user.uid,
    userName: req.user.fullName,
    rating: parseInt(rating),
    comment: comment?.trim() || '',
    createdAt: new Date().toISOString(),
  };

  reviews.push(newReview);
  const avgRating = Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10;

  await productRef.update({
    reviews,
    rating: avgRating,
    reviewCount: reviews.length,
    updatedAt: new Date().toISOString(),
  });

  res.status(201).json({ success: true, message: 'Review added', data: { rating: avgRating, reviewCount: reviews.length } });
});

module.exports = { getProducts, getFeaturedProducts, getCategories, getProductById, createProduct, updateProduct, deleteProduct, addReview };
