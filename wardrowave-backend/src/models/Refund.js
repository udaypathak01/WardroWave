import mongoose from 'mongoose';
import { paiseField } from './schemaFields.js';

const refundSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', required: true },
    razorpayRefundId: { type: String, unique: true, sparse: true },
    amount: paiseField({ required: true, min: 1 }),
    reason: { type: String, enum: ['cancellation', 'deposit_return', 'admin_goodwill', 'failed_delivery'], required: true },
    speed: { type: String, enum: ['normal', 'optimum'], default: 'normal' },
    status: { type: String, enum: ['pending', 'processed', 'failed'], default: 'pending' },
    submissionAttempts: { type: Number, default: 0, min: 0, max: 5 },
    lastAttemptAt: Date,
    lastError: String,
    escalatedAt: Date,
    initiatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: String,
    processedAt: Date,
  },
  { timestamps: true, versionKey: false }
);

refundSchema.index({ booking: 1, status: 1 });
refundSchema.index({ status: 1, createdAt: 1, submissionAttempts: 1, lastAttemptAt: 1 });

export const Refund = mongoose.model('Refund', refundSchema);
