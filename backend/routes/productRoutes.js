const express = require('express');
const router = express.Router();
const {
  getProducts, getFeaturedProducts, getCategories,
  getProductById, createProduct, updateProduct,
  deleteProduct, addReview
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');

// ─── Public routes ────────────────────────────────────────────────────────────
router.get('/',          getProducts);
router.get('/featured',  getFeaturedProducts);
router.get('/categories', getCategories);

// ─── Protected routes ─────────────────────────────────────────────────────────
router.post('/',                 protect, authorize('admin'), createProduct);

// ─── Public param route — after all specific string routes ────────────────────
router.get('/:id', getProductById);

// ─── Protected param routes ───────────────────────────────────────────────────
router.put('/:id',          protect, authorize('admin'), updateProduct);
router.delete('/:id',       protect, authorize('admin'), deleteProduct);
router.post('/:id/review',  protect, addReview);

module.exports = router;

