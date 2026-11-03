import { z } from 'zod';
import { objectId, rentalDate } from './common.validator.js';

export const availabilityQuerySchema = z.object({
  startDate: rentalDate,
  endDate: rentalDate,
});

export const availabilityParamsSchema = z.object({
  variantId: objectId,
});

export const bookingParamsSchema = z.object({
  id: objectId,
});

export const blockedDatesParamsSchema = z.object({
  productId: objectId,
});

export const blockedDatesQuerySchema = z.object({
  variantId: objectId,
  fromDate: rentalDate,
  toDate: rentalDate,
});
