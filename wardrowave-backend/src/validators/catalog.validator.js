import { z } from 'zod';
import { objectId, pincode, rentalDate, slug } from './common.validator.js';

export const catalogQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  category: objectId.optional(),
  search: z.string().trim().min(1).max(100).optional(),
  q: z.string().trim().min(1).max(100).optional(),
  occasion: z.enum(['wedding', 'party', 'festive', 'cocktail', 'casual', 'formal']).optional(),
  gender: z.enum(['women', 'men', 'unisex', 'kids']).optional(),
  size: z.string().trim().min(1).max(30).optional(),
  color: z.string().trim().min(1).max(50).optional(),
  brand: z.string().trim().min(1).max(100).optional(),
  minPrice: z.coerce.number().int().nonnegative().optional(),
  maxPrice: z.coerce.number().int().nonnegative().optional(),
  available: z.preprocess(
    (value) => value === 'true' ? true : value === 'false' ? false : value,
    z.boolean().optional()
  ),
  startDate: rentalDate.optional(),
  endDate: rentalDate.optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc', 'popular', 'rating', 'featured']).default('newest'),
}).strict().superRefine((query, context) => {
  if (query.q && query.search) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['q'],
      message: 'Use either q or search, not both',
    });
  }
  if (query.available && (!query.startDate || !query.endDate)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['startDate'],
      message: 'startDate and endDate are required when available=true',
    });
  }
  if (Boolean(query.startDate) !== Boolean(query.endDate)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['endDate'],
      message: 'startDate and endDate must be provided together',
    });
  }
  if (query.minPrice !== undefined && query.maxPrice !== undefined && query.minPrice > query.maxPrice) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['maxPrice'],
      message: 'maxPrice must be greater than or equal to minPrice',
    });
  }
});

export const catalogPrerenderQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(100),
}).strict();

export const productSlugParamsSchema = z.object({
  slug,
}).strict();

export const slugAvailabilityQuerySchema = z.object({
  variantId: objectId,
  from: rentalDate,
  to: rentalDate,
  startDate: rentalDate.optional(),
  endDate: rentalDate.optional(),
}).strict().superRefine((query, context) => {
  if (Boolean(query.startDate) !== Boolean(query.endDate)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['endDate'],
      message: 'startDate and endDate must be provided together',
    });
  }
});

export const similarProductsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(20).default(8),
}).strict();

export const pincodeParamsSchema = z.object({
  pincode,
}).strict();
