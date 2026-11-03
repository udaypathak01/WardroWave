import { z } from 'zod';
import { objectId, rentalDate } from './common.validator.js';

const page = z.coerce.number().int().safe().min(1).max(10_000).default(1);
const limit = z.coerce.number().int().min(1).max(100).default(20);
const search = z.string().trim().max(100).optional().transform((value) => value || undefined);
const boolQuery = z.enum(['true', 'false']).transform((value) => value === 'true');
const dateRange = {
  from: rentalDate.optional(),
  to: rentalDate.optional(),
};

function validDateRange(value) {
  return !value.from || !value.to || value.from <= value.to;
}

const paginated = { page, limit, q: search };

export const adminBookingsQuerySchema = z.object({
  ...paginated,
  ...dateRange,
  status: z.enum([
    'pending_payment', 'confirmed', 'partially_dispatched', 'dispatched', 'delivered',
    'return_requested', 'returned', 'completed', 'cancelled', 'payment_failed', 'expired',
  ]).optional(),
  userId: objectId.optional(),
}).strict().refine(validDateRange, 'The start date must not follow the end date');

export const adminPaymentsQuerySchema = z.object({
  ...paginated,
  ...dateRange,
  status: z.enum(['created', 'authorized', 'captured', 'failed', 'refunded', 'partially_refunded']).optional(),
}).strict().refine(validDateRange, 'The start date must not follow the end date');

export const adminCustomersQuerySchema = z.object({
  ...paginated,
  role: z.enum(['customer', 'staff', 'admin', 'superadmin']).optional(),
  status: z.enum(['active', 'blocked']).optional(),
}).strict();

export const adminProductsQuerySchema = z.object({
  ...paginated,
  status: z.enum(['draft', 'published', 'archived']).optional(),
  category: objectId.optional(),
  isFeatured: boolQuery.optional(),
}).strict();

export const adminCategoriesQuerySchema = z.object({
  ...paginated,
  isActive: boolQuery.optional(),
}).strict();

export const adminInventoryQuerySchema = z.object({
  ...paginated,
  status: z.enum(['available', 'reserved', 'rented', 'cleaning', 'maintenance', 'retired']).optional(),
  productId: objectId.optional(),
  variantId: objectId.optional(),
}).strict();

export const adminCouponsQuerySchema = z.object({
  ...paginated,
  isActive: boolQuery.optional(),
}).strict();

export const adminReviewsQuerySchema = z.object({
  ...paginated,
  status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
}).strict();

export const adminAuditLogsQuerySchema = z.object({
  ...paginated,
  ...dateRange,
  action: z.string().trim().min(1).max(120).optional(),
  entityType: z.string().trim().min(1).max(80).optional(),
  actorId: objectId.optional(),
}).strict().refine(validDateRange, 'The start date must not follow the end date');

export const adminIdParamsSchema = z.object({ id: objectId }).strict();
export const adminProductIdParamsSchema = z.object({ productId: objectId }).strict();
export const adminCouponIdParamsSchema = z.object({ couponId: objectId }).strict();
export const adminPaymentIdParamsSchema = z.object({ paymentId: objectId }).strict();
