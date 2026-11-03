import { z } from 'zod';
import { pincode } from './common.validator.js';

const paise = z.number().int().nonnegative().refine(Number.isSafeInteger);
const rentalDays = z.number().int().min(1).max(365);
const nonNegativeDays = z.number().int().min(0).max(365);

export const settingsUpdateSchema = z.object({
  minRentalDays: rentalDays.optional(),
  maxRentalDays: rentalDays.optional(),
  minLeadDays: nonNegativeDays.optional(),
  maxAdvanceDays: z.number().int().positive().max(730).optional(),
  deliveryBufferDays: nonNegativeDays.optional(),
  returnBufferDays: nonNegativeDays.optional(),
  holdMinutes: z.number().int().positive().max(120).optional(),
  gstPercent: z.number().int().min(0).max(100).optional(),
  deliveryFee: paise.optional(),
  freeDeliveryAbove: paise.optional(),
  lateFeeMultiplier: z.number().positive().refine((value) => {
    const decimalPlaces = String(value).split('.')[1]?.length ?? 0;
    return decimalPlaces <= 6;
  }).optional(),
  freeCancelHours: z.number().int().min(0).max(720).optional(),
}).strict().refine((value) => Object.keys(value).length > 0, 'At least one setting is required');

export const pincodeParamsSchema = z.object({
  pincode,
}).strict();
export const pincodeUpdateSchema = z.object({
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().min(1).max(100),
  deliveryDays: z.number().int().min(0).max(30),
  isActive: z.boolean().default(true),
}).strict();
