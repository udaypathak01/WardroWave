const { getDB } = require('../config/firebase');
const COLLECTIONS = require('../config/collections');
const { asyncHandler } = require('../middleware/errorHandler');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const generateOrderId = () => {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${ts}-${rand}`;
};

const calcPricing = (items, discount = 0) => {
  const subtotal = items.reduce((s, i) => s + (i.itemTotal || 0), 0);
  const tax = subtotal * 0.18;
  const deliveryFee = items.length > 0 ? 99 : 0;
  const total = subtotal + tax + deliveryFee - discount;
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    taxRate: 0.18,
    deliveryFee,
    discount,
    total: Math.round(total * 100) / 100,
  };
};

// ─── POST /api/orders ─────────────────────────────────────────────────────────

const createOrder = asyncHandler(async (req, res) => {
  const db = getDB();
  const uid = req.user.uid;
  const { shippingAddress, paymentMethod, notes } = req.body;

  if (!shippingAddress || !paymentMethod) {
    return res.status(400).json({ success: false, message: 'Shipping address and payment method are required' });
  }

  const validMethods = ['credit-card', 'debit-card', 'upi', 'wallet', 'cod', 'netbanking'];
  if (!validMethods.includes(paymentMethod)) {
    return res.status(400).json({ success: false, message: 'Invalid payment method' });
  }

  // Get cart
  const cartDoc = await db.collection(COLLECTIONS.CARTS).doc(uid).get();
  const cartItems = cartDoc.exists ? (cartDoc.data().items || []) : [];

  if (cartItems.length === 0) {
    return res.status(400).json({ success: false, message: 'Cart is empty' });
  }

  // Load and validate all products
  const productDocs = await Promise.all(
    cartItems.map(item => db.collection(COLLECTIONS.PRODUCTS).doc(item.productId).get())
  );

  const outOfStock = [];
  const orderItems = cartItems.map((item, idx) => {
    const pDoc = productDocs[idx];
    if (!pDoc.exists || !pDoc.data().isActive) return null;
    const p = pDoc.data();
    if (!p.inStock) { outOfStock.push(p.name); return null; }

    const itemTotal = Math.round(p.rentalPrice * item.quantity * (item.rentalDays / (p.duration || 3)) * 100) / 100;
    return {
      productId: item.productId,
      name: p.name,
      rentalPrice: p.rentalPrice,
      originalPrice: p.originalPrice,
      image: p.images?.[0]?.url || '',
      category: p.category,
      duration: p.duration,
      quantity: item.quantity,
      rentalDays: item.rentalDays,
      size: item.size || '',
      itemTotal,
      status: 'pending',
      ownerId: p.owner || 'WardroWave',
    };
  }).filter(Boolean);

  if (outOfStock.length > 0) {
    return res.status(400).json({ success: false, message: `Out of stock: ${outOfStock.join(', ')}` });
  }

  const pricing = calcPricing(orderItems);

  const orderId = generateOrderId();
  const orderData = {
    orderId,
    uid,
    userEmail: req.user.email,
    userName: req.user.fullName,
    items: orderItems,
    shippingAddress: { ...shippingAddress, email: shippingAddress.email || req.user.email },
    pricing,
    totalAmount: pricing.total,
    payment: {
      method: paymentMethod,
      status: paymentMethod === 'cod' ? 'pending' : 'success',
      transactionId: `TXN-${Date.now()}`,
      paidAt: paymentMethod !== 'cod' ? new Date().toISOString() : null,
    },
    status: paymentMethod === 'cod' ? 'pending' : 'confirmed',
    notes: notes || '',
    ownerIds: [...new Set(orderItems.map(i => i.ownerId))],
    trackingNumber: null,
    cancelReason: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Save order
  await db.collection(COLLECTIONS.ORDERS).doc(orderId).set(orderData);

  // Clear cart
  await db.collection(COLLECTIONS.CARTS).doc(uid).update({ items: [], updatedAt: new Date().toISOString() });

  // Update product rental stats
  await Promise.all(
    orderItems.map(item =>
      db.collection(COLLECTIONS.PRODUCTS).doc(item.productId).update({
        totalRentals: (require('firebase-admin').firestore.FieldValue.increment(item.quantity)),
        totalEarnings: (require('firebase-admin').firestore.FieldValue.increment(item.itemTotal)),
      })
    )
  );

  res.status(201).json({ success: true, message: 'Order placed successfully', data: { order: orderData } });
});

// ─── GET /api/orders ──────────────────────────────────────────────────────────

const getUserOrders = asyncHandler(async (req, res) => {
  const db = getDB();
  const { status, limit = '10' } = req.query;

  let query = db.collection(COLLECTIONS.ORDERS)
    .where('uid', '==', req.user.uid);

  if (status) query = query.where('status', '==', status);

  const snap = await query.get();
  let orders = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // Sort in memory to avoid needing a Firestore composite index
  orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  // Apply limit in memory
  orders = orders.slice(0, Math.min(50, parseInt(limit)));

  res.status(200).json({ success: true, data: { orders, total: orders.length } });
});

// ─── GET /api/orders/:orderId ─────────────────────────────────────────────────

const getOrderById = asyncHandler(async (req, res) => {
  const db = getDB();
  const doc = await db.collection(COLLECTIONS.ORDERS).doc(req.params.orderId).get();

  if (!doc.exists) return res.status(404).json({ success: false, message: 'Order not found' });

  const order = doc.data();
  if (order.uid !== req.user.uid && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  res.status(200).json({ success: true, data: { order } });
});

// ─── PUT /api/orders/:orderId/cancel ─────────────────────────────────────────

const cancelOrder = asyncHandler(async (req, res) => {
  const db = getDB();
  const { reason } = req.body;
  const doc = await db.collection(COLLECTIONS.ORDERS).doc(req.params.orderId).get();

  if (!doc.exists) return res.status(404).json({ success: false, message: 'Order not found' });

  const order = doc.data();
  if (order.uid !== req.user.uid) return res.status(403).json({ success: false, message: 'Not authorized' });

  if (!['pending', 'confirmed'].includes(order.status)) {
    return res.status(400).json({ success: false, message: `Cannot cancel a '${order.status}' order` });
  }

  await db.collection(COLLECTIONS.ORDERS).doc(req.params.orderId).update({
    status: 'cancelled',
    cancelReason: reason || 'Cancelled by user',
    'payment.status': order.payment.status === 'success' ? 'refunded' : order.payment.status,
    updatedAt: new Date().toISOString(),
  });

  res.status(200).json({ success: true, message: 'Order cancelled' });
});

module.exports = { createOrder, getUserOrders, getOrderById, cancelOrder };
