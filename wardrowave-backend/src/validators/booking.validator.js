import { z } from 'zod';
import { objectId, rentalDate } from './common.validator.js';

export const createBookingSchema = z
  .object({
    addressId: objectId,
    items: z
      .array(
        z.object({
          variantId: objectId,
          startDate: rentalDate,
          endDate: rentalDate,
        }).strict()
      )
      .min(1)
      .max(10)
      .optional(),
    couponCode: z.string().trim().min(1).max(64).optional(),
  })
  .strict();
