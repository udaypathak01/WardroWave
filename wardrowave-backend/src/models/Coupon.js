import mongoose from 'mongoose';
import { paiseField, safeIntegerField } from './schemaFields.js';

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: String,
    type: { type: String, enum: ['percent', 'flat'], required: true },
    value: safeIntegerField({ required: true }),
    maxDiscount: paiseField(),
    minRentalSubtotal: paiseField({ defaultValue: 0 }),
    startsAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true },
    usageLimit: { type: Number, min: 1 },
    perUserLimit: { type: Number, default: 1, min: 1 },
    usedCount: { type: Number, default: 0, min: 0 },
    reservedCount: { type: Number, default: 0, min: 0 },
    applicableCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    applicableProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    firstBookingOnly: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false }
);

couponSchema.index({ isActive: 1, startsAt: 1, expiresAt: 1 });
couponSchema.index({ isActive: 1, deletedAt: 1, createdAt: -1 });
couponSchema.pre('validate', function validateCoupon(next) {
  if (this.type === 'percent' && this.value > 100) {
    this.invalidate('value', 'Percentage coupon value cannot exceed 100');
  }
  if (this.expiresAt < this.startsAt) {
    this.invalidate('expiresAt', 'Coupon expiry must not precede its start');
  }
  next();
});

export const Coupon = mongoose.model('Coupon', couponSchema);
