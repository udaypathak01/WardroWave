import { z } from 'zod';
import { objectId, rentalDate } from './common.validator.js';

export const cartItemSchema = z.object({
  variantId: objectId,
  startDate: rentalDate,
  endDate: rentalDate,
}).strict();
export const cartItemParamsSchema = z.object({ itemId: objectId });
export const cartCouponSchema = z.object({
  couponCode: z.string().trim().min(2).max(40).nullable(),
}).strict();
