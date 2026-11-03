import mongoose from 'mongoose';
import { paiseField, safeIntegerField } from './schemaFields.js';

const itemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variant: { type: mongoose.Schema.Types.ObjectId, ref: 'Variant', required: true },
    unit: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryUnit' },
    reservation: { type: mongoose.Schema.Types.ObjectId, ref: 'Reservation' },
    titleSnapshot: { type: String, required: true },
    imageSnapshot: String,
    sizeSnapshot: String,
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    rentalDays: safeIntegerField({ required: true, min: 1 }),
    rentalCharge: paiseField({ required: true }),
    extraDays: safeIntegerField({ defaultValue: 0 }),
    securityDeposit: paiseField({ required: true }),
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'dispatched', 'delivered', 'return_requested', 'overdue', 'returned', 'inspected', 'completed', 'cancelled'],
      default: 'pending',
    },
  },
  { _id: true }
);

const bookingSchema = new mongoose.Schema(
  {
    bookingNumber: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: { type: [itemSchema], required: true, validate: [(items) => items.length > 0, 'Booking must have at least one item'] },
    shippingAddress: { type: mongoose.Schema.Types.Mixed, required: true },
    deliveryPincode: { type: String, match: /^\d{6}$/ },
    pricing: {
      rentalSubtotal: paiseField({ required: true }),
      discount: paiseField({ defaultValue: 0 }),
      couponCode: String,
      deliveryFee: paiseField({ required: true }),
      taxableAmount: paiseField({ required: true }),
      gstPercent: safeIntegerField({ required: true, min: 0 }),
      gstAmount: paiseField({ required: true }),
      depositTotal: paiseField({ required: true }),
      grandTotal: paiseField({ required: true }),
      currency: { type: String, enum: ['INR'], default: 'INR' },
    },
    status: {
      type: String,
      enum: ['pending_payment', 'confirmed', 'partially_dispatched', 'dispatched', 'delivered', 'return_requested', 'returned', 'completed', 'cancelled', 'payment_failed', 'expired'],
      default: 'pending_payment',
    },
    payment: {
      razorpayOrderId: String,
      razorpayPaymentId: String,
      method: String,
      status: { type: String, enum: ['created', 'authorized', 'captured', 'failed', 'refunded', 'partially_refunded'], default: 'created' },
      paidAt: Date,
      retryCount: { type: Number, default: 0, min: 0, max: 1 },
    },
    timeline: [{ status: String, note: String, actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, at: { type: Date, default: Date.now } }],
    logistics: {
      outboundCarrier: String,
      outboundTracking: String,
      dispatchedAt: Date,
      deliveredAt: Date,
      returnCarrier: String,
      returnTracking: String,
      pickupScheduledAt: Date,
      receivedAt: Date,
    },
    settlement: {
      lateDays: safeIntegerField({ defaultValue: 0 }),
      lateFee: paiseField({ defaultValue: 0 }),
      damageLevel: { type: String, enum: ['none', 'minor', 'major', 'lost'] },
      damageCharge: paiseField({ defaultValue: 0 }),
      damageNotes: String,
      damagePhotos: [String],
      depositRefunded: paiseField({ defaultValue: 0 }),
      depositDeducted: paiseField({ defaultValue: 0 }),
      outstandingAmount: paiseField({ defaultValue: 0 }),
      settledAt: Date,
    },
    cancellation: {
      cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      reason: String,
      refundAmount: paiseField(),
      retainedAmount: paiseField(),
      cancelledAt: Date,
    },
    invoiceNumber: String,
    holdExpiresAt: Date,
    idempotencyKey: { type: String, sparse: true },
  },
  { timestamps: true, versionKey: false }
);

bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ createdAt: 1, status: 1 });
bookingSchema.index({ status: 1, createdAt: -1 });
bookingSchema.index({ 'payment.razorpayOrderId': 1 }, { unique: true, sparse: true });
bookingSchema.index({ 'items.endDate': 1, status: 1 });
bookingSchema.index({ 'items.startDate': 1, status: 1 });
bookingSchema.index({ user: 1, idempotencyKey: 1 }, { unique: true, sparse: true });

export const Booking = mongoose.model('Booking', bookingSchema);
