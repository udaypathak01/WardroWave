import { z } from 'zod';
import { objectId, pincode, rentalDate } from './common.validator.js';

export const quoteSchema = z.object({
  items: z
    .array(
      z.object({
        variantId: objectId,
        startDate: rentalDate,
        endDate: rentalDate,
      }).strict()
    )
    .min(1)
    .max(10),
  couponCode: z.string().trim().min(1).max(64).optional(),
  pincode,
}).strict();
