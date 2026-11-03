import { AuditLog } from '../models/AuditLog.js';
import { Booking } from '../models/Booking.js';
import { Category } from '../models/Category.js';
import { Coupon } from '../models/Coupon.js';
import { InventoryUnit } from '../models/InventoryUnit.js';
import { Product } from '../models/Product.js';
import { Payment } from '../models/Payment.js';
import { Refund } from '../models/Refund.js';
import { Review } from '../models/Review.js';
import { User } from '../models/User.js';
import { Variant } from '../models/Variant.js';
import { ApiError } from '../utils/ApiError.js';

const pageMeta = (page, limit, total) => ({
  page,
  limit,
  total,
  pages: Math.ceil(total / limit),
});

function pagination({ page, limit }) {
  return { skip: (page - 1) * limit, limit };
}

function searchRegex(value) {
  return value ? new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') : undefined;
}

function dateBounds({ from, to }) {
  const bounds = {};
  if (from) bounds.$gte = new Date(`${from}T00:00:00.000Z`);
  if (to) {
    const exclusiveEnd = new Date(`${to}T00:00:00.000Z`);
    exclusiveEnd.setUTCDate(exclusiveEnd.getUTCDate() + 1);
    bounds.$lt = exclusiveEnd;
  }
  return Object.keys(bounds).length ? bounds : undefined;
}

async function findPage(model, filter, { page, limit }, configure = (query) => query) {
  const { skip } = pagination({ page, limit });
  let query = model.find(filter);
  query = configure(query).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit);
  const [items, total] = await Promise.all([
    query.lean().exec(),
    model.countDocuments(filter).exec(),
  ]);
  return { items, meta: pageMeta(page, limit, total) };
}

export async function getAdminDashboard() {
  const [
    totalBookings,
    pendingPaymentBookings,
    activeBookings,
    totalCustomers,
    totalProducts,
    draftProducts,
    totalInventoryUnits,
    availableInventoryUnits,
    pendingReviews,
    recentBookings,
  ] = await Promise.all([
    Booking.countDocuments().exec(),
    Booking.countDocuments({ status: 'pending_payment' }).exec(),
    Booking.countDocuments({
      status: { $in: ['confirmed', 'partially_dispatched', 'dispatched', 'delivered', 'return_requested'] },
    }).exec(),
    User.countDocuments({ role: 'customer', status: 'active', deletedAt: null }).exec(),
    Product.countDocuments({ deletedAt: null }).exec(),
    Product.countDocuments({ status: 'draft', deletedAt: null }).exec(),
    InventoryUnit.countDocuments().exec(),
    InventoryUnit.countDocuments({ status: 'available' }).exec(),
    Review.countDocuments({ status: 'pending' }).exec(),
    Booking.find()
      .select('bookingNumber user status pricing.grandTotal createdAt')
      .populate({ path: 'user', select: 'name email' })
      .sort({ createdAt: -1, _id: -1 })
      .limit(5)
      .lean()
      .exec(),
  ]);

  return {
    bookings: { total: totalBookings, pendingPayment: pendingPaymentBookings, active: activeBookings },
    customers: { active: totalCustomers },
    products: { total: totalProducts, drafts: draftProducts },
    inventory: { total: totalInventoryUnits, available: availableInventoryUnits },
    pendingReviews,
    recentBookings,
  };
}

export async function listAdminBookings(filters) {
  const filter = {};
  if (filters.status) filter.status = filters.status;
  if (filters.userId) filter.user = filters.userId;
  if (filters.from || filters.to) filter.createdAt = dateBounds(filters);
  if (filters.q) filter.bookingNumber = searchRegex(filters.q);
  return findPage(Booking, filter, filters, (query) => query
    .select('bookingNumber user items.titleSnapshot items.status pricing.grandTotal payment.status status createdAt')
    .populate({ path: 'user', select: 'name email phone' }));
}

export async function listAdminPayments(filters) {
  const filter = {};
  if (filters.status) filter.status = filters.status;
  const bounds = dateBounds(filters);
  if (bounds) filter.createdAt = bounds;
  if (filters.q) {
    const regex = searchRegex(filters.q);
    const bookings = await Booking.find({ bookingNumber: regex }).select('_id').lean().exec();
    filter.$or = [
      { razorpayOrderId: regex },
      { razorpayPaymentId: regex },
      ...(bookings.length ? [{ booking: { $in: bookings.map(({ _id }) => _id) } }] : []),
    ];
  }
  const result = await findPage(Payment, filter, filters, (query) => query
    .select('booking user razorpayOrderId razorpayPaymentId amount refundedAmount refundReservedAmount currency status method bank cardLast4 cardNetwork errorCode errorDescription paidAt createdAt')
    .populate({
      path: 'booking',
      select: 'bookingNumber status',
    })
    .populate({ path: 'user', select: 'name email' }));
  const refunds = result.items.length
    ? await Refund.find({ payment: { $in: result.items.map(({ _id }) => _id) } })
      .select('payment amount reason status notes razorpayRefundId createdAt processedAt')
      .sort({ createdAt: -1, _id: -1 })
      .lean()
      .exec()
    : [];
  const refundsByPayment = new Map();
  for (const refund of refunds) {
    const paymentId = String(refund.payment);
    const paymentRefunds = refundsByPayment.get(paymentId) ?? [];
    paymentRefunds.push(refund);
    refundsByPayment.set(paymentId, paymentRefunds);
  }
  return {
    ...result,
    items: result.items.map((payment) => ({
      ...payment,
      refundableAmount: Math.max(
        0,
        payment.amount - payment.refundedAmount - payment.refundReservedAmount,
      ),
      refunds: refundsByPayment.get(String(payment._id)) ?? [],
    })),
  };
}

export async function getAdminBooking(bookingId) {
  const booking = await Booking.findById(bookingId)
    .populate({ path: 'user', select: 'name email phone role status' })
    .populate({ path: 'items.product', select: 'title slug images' })
    .populate({ path: 'items.variant', select: 'sku size color' })
    .populate({ path: 'items.unit', select: 'unitCode status condition' })
    .populate({ path: 'timeline.actor', select: 'name email role' })
    .lean()
    .exec();
  if (!booking) throw new ApiError(404, 'Booking not found');
  return booking;
}

export async function listAdminCustomers(filters) {
  const filter = { deletedAt: null };
  if (filters.role) filter.role = filters.role;
  if (filters.status) filter.status = filters.status;
  if (filters.q) {
    const regex = searchRegex(filters.q);
    filter.$or = [{ name: regex }, { email: regex }, { phone: regex }];
  }
  return findPage(User, filter, filters, (query) => query
    .select('_id name email phone emailVerified role status createdAt lastLoginAt'));
}

export async function getAdminCustomer(userId) {
  const user = await User.findOne({ _id: userId, deletedAt: null })
    .select('_id name email phone emailVerified role status avatar addresses createdAt lastLoginAt')
    .lean()
    .exec();
  if (!user) throw new ApiError(404, 'Customer not found');
  const [bookingCount, recentBookings] = await Promise.all([
    Booking.countDocuments({ user: userId }).exec(),
    Booking.find({ user: userId })
      .select('bookingNumber status pricing.grandTotal createdAt')
      .sort({ createdAt: -1, _id: -1 })
      .limit(5)
      .lean()
      .exec(),
  ]);
  return { ...user, bookingCount, recentBookings };
}

export async function listAdminProducts(filters) {
  const filter = filters.status === 'archived'
    ? { status: 'archived' }
    : { deletedAt: null };
  if (filters.status) filter.status = filters.status;
  if (filters.category) filter.category = filters.category;
  if (filters.isFeatured !== undefined) filter.isFeatured = filters.isFeatured;
  if (filters.q) {
    const regex = searchRegex(filters.q);
    filter.$or = [{ title: regex }, { brand: regex }];
  }
  return findPage(Product, filter, filters, (query) => query
    .populate({ path: 'category', select: 'name slug' }));
}

export async function getAdminProduct(productId) {
  const product = await Product.findById(productId)
    .populate({ path: 'category', select: 'name slug isActive' })
    .lean()
    .exec();
  if (!product) throw new ApiError(404, 'Product not found');
  const [variants, inventory] = await Promise.all([
    Variant.find({ product: productId }).sort({ size: 1, color: 1 }).lean().exec(),
    InventoryUnit.aggregate([
      { $match: { product: product._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]).exec(),
  ]);
  return {
    ...product,
    variants,
    inventory: inventory.map(({ _id, count }) => ({ status: _id, count })),
  };
}

export async function listAdminCategories(filters) {
  const filter = {};
  if (filters.isActive !== undefined) filter.isActive = filters.isActive;
  if (filters.q) filter.name = searchRegex(filters.q);
  return findPage(Category, filter, filters, (query) =>
    query.populate({ path: 'parent', select: 'name slug' }));
}

export async function listAdminInventory(filters) {
  const filter = {};
  if (filters.status) filter.status = filters.status;
  if (filters.productId) filter.product = filters.productId;
  if (filters.variantId) filter.variant = filters.variantId;
  if (filters.q) filter.unitCode = searchRegex(filters.q);
  return findPage(InventoryUnit, filter, filters, (query) => query
    .populate({ path: 'product', select: 'title slug status' })
    .populate({ path: 'variant', select: 'sku size color isActive' }));
}

export async function listAdminCoupons(filters) {
  const filter = { deletedAt: null };
  if (filters.isActive !== undefined) filter.isActive = filters.isActive;
  if (filters.q) filter.code = searchRegex(filters.q);
  return findPage(Coupon, filter, filters);
}

export async function getAdminCoupon(couponId) {
  const coupon = await Coupon.findOne({ _id: couponId, deletedAt: null })
    .populate({ path: 'applicableCategories', select: 'name slug' })
    .populate({ path: 'applicableProducts', select: 'title slug status' })
    .lean()
    .exec();
  if (!coupon) throw new ApiError(404, 'Coupon not found');
  return coupon;
}

export async function listAdminReviews(filters) {
  const filter = { status: filters.status };
  if (filters.q) {
    const regex = searchRegex(filters.q);
    filter.$or = [{ title: regex }, { comment: regex }];
  }
  return findPage(Review, filter, filters, (query) => query
    .populate({ path: 'user', select: 'name email avatar.url' })
    .populate({ path: 'product', select: 'title slug images' }));
}

export async function listAdminAuditLogs(filters) {
  const filter = {};
  if (filters.action) filter.action = filters.action;
  if (filters.entityType) filter.entityType = filters.entityType;
  if (filters.actorId) filter.actor = filters.actorId;
  const bounds = dateBounds(filters);
  if (bounds) filter.createdAt = bounds;
  return findPage(AuditLog, filter, filters, (query) =>
    query.populate({ path: 'actor', select: 'name email role' }));
}
