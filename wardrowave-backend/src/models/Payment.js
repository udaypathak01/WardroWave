import mongoose from 'mongoose';
import { paiseField } from './schemaFields.js';

const paymentSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    razorpayOrderId: { type: String, required: true, unique: true },
    razorpayPaymentId: { type: String, unique: true, sparse: true },
    razorpaySignature: String,
    amount: paiseField({ required: true }),
    refundedAmount: paiseField({ defaultValue: 0 }),
    refundReservedAmount: paiseField({ defaultValue: 0 }),
    currency: { type: String, default: 'INR', enum: ['INR'] },
    status: { type: String, enum: ['created', 'authorized', 'captured', 'failed', 'refunded', 'partially_refunded'], default: 'created' },
    method: String,
    bank: String,
    vpa: String,
    cardLast4: { type: String, match: /^\d{4}$/ },
    cardNetwork: String,
    errorCode: String,
    errorDescription: String,
    attempts: [{ at: Date, status: String, errorCode: String, errorDescription: String }],
    paidAt: Date,
    rawPayload: { type: mongoose.Schema.Types.Mixed, select: false },
  },
  { timestamps: true, versionKey: false }
);

paymentSchema.index({ status: 1, paidAt: 1 });

export const Payment = mongoose.model('Payment', paymentSchema);
