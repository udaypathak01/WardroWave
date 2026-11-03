import mongoose from 'mongoose';
import { paiseField } from './schemaFields.js';

const couponRedemptionSchema = new mongoose.Schema(
  {
    coupon: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    amount: paiseField({ required: true }),
    reversedAt: Date,
  },
  { timestamps: true, versionKey: false }
);

couponRedemptionSchema.index({ coupon: 1, booking: 1 }, { unique: true });
couponRedemptionSchema.index({ coupon: 1, user: 1 });

export const CouponRedemption = mongoose.model('CouponRedemption', couponRedemptionSchema);
