import { env } from './env.js';

export const DEFAULT_SETTINGS = {
  minRentalDays: 3,
  maxRentalDays: 14,
  minLeadDays: env.MIN_LEAD_DAYS,
  maxAdvanceDays: env.MAX_ADVANCE_DAYS,
  deliveryBufferDays: 1,
  returnBufferDays: 2,
  holdMinutes: env.HOLD_MINUTES,
  gstPercent: env.GST_PERCENT,
  deliveryFee: env.DELIVERY_FEE,
  freeDeliveryAbove: env.FREE_DELIVERY_ABOVE,
  lateFeeMultiplier: env.LATE_FEE_MULTIPLIER,
  freeCancelHours: env.FREE_CANCEL_HOURS,
};
