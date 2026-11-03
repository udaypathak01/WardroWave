import { describe, expect, it } from '@jest/globals';
import {
  adminAuditLogsQuerySchema,
  adminBookingsQuerySchema,
  adminProductsQuerySchema,
  adminCustomersQuerySchema,
  adminInventoryQuerySchema,
  adminPaymentsQuerySchema,
  adminReviewsQuerySchema,
} from '../../src/validators/adminRead.validator.js';
import { adminRefundSchema } from '../../src/validators/adminPayment.validator.js';

describe('admin read validation', () => {
  it('applies bounded pagination defaults and strict filters', () => {
    expect(adminCustomersQuerySchema.parse({})).toEqual({ page: 1, limit: 20 });
    expect(adminCustomersQuerySchema.parse({ page: '2', limit: '50', role: 'customer' }))
      .toEqual({ page: 2, limit: 50, role: 'customer' });
    expect(() => adminCustomersQuerySchema.parse({ unknown: 'value' })).toThrow();
    expect(() => adminCustomersQuerySchema.parse({ limit: '101' })).toThrow();
  });

  it('validates dashboard table filters and normalizes booleans', () => {
    expect(adminProductsQuerySchema.parse({ isFeatured: 'false' }).isFeatured).toBe(false);
    expect(adminInventoryQuerySchema.parse({ status: 'available', productId: '000000000000000000000001' }))
      .toMatchObject({ status: 'available' });
    expect(adminBookingsQuerySchema.parse({ from: '2025-01-01', to: '2025-01-05' }))
      .toMatchObject({ from: '2025-01-01', to: '2025-01-05' });
    expect(() => adminBookingsQuerySchema.parse({ from: '2025-02-01', to: '2025-01-01' })).toThrow();
    expect(() => adminAuditLogsQuerySchema.parse({ from: '2025-02-30' })).toThrow();
  });

  it('defaults the review queue to pending and rejects invalid states', () => {
    expect(adminReviewsQuerySchema.parse({}).status).toBe('pending');
    expect(() => adminReviewsQuerySchema.parse({ status: 'queued' })).toThrow();
  });

  it('validates payment filters and positive paise refund requests', () => {
    expect(adminPaymentsQuerySchema.parse({ status: 'partially_refunded', page: '2' }))
      .toMatchObject({ status: 'partially_refunded', page: 2 });
    expect(() => adminPaymentsQuerySchema.parse({ status: 'pending' })).toThrow();
    expect(adminRefundSchema.parse({ amount: 500, notes: 'Support adjustment' }))
      .toEqual({ amount: 500, notes: 'Support adjustment' });
    expect(() => adminRefundSchema.parse({ amount: 0, notes: 'Invalid' })).toThrow();
    expect(() => adminRefundSchema.parse({ amount: 500, notes: '  ' })).toThrow();
  });
});
