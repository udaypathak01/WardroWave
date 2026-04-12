const express = require('express');
const router = express.Router();
const { createOrder, getUserOrders, getOrderById, cancelOrder } = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/', createOrder);
router.get('/', getUserOrders);

// Dynamic routes
router.get('/:orderId', getOrderById);
router.put('/:orderId/cancel', cancelOrder);

module.exports = router;
