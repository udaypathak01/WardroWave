import { describe, expect, it, jest } from '@jest/globals';
import { errorHandler } from '../../src/middlewares/errorHandler.js';
import { ApiError } from '../../src/utils/ApiError.js';
import { ApiResponse } from '../../src/utils/ApiResponse.js';
import {
  objectId,
  paise,
  paginationQuery,
  phoneIN,
  pincode,
  rentalDate,
  slug,
} from '../../src/validators/common.validator.js';

function responseHarness() {
  const res = {
    statusCode: undefined,
    body: undefined,
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  return res;
}

describe('API response and validation conventions', () => {
  it('uses the standard success envelope and omits optional metadata', () => {
    const res = responseHarness();
    res.req = { id: 'request-123' };
    ApiResponse.success(res, { id: 'booking-1' }, { page: 1, pages: 7 }, 201);
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({
      success: true,
      data: { id: 'booking-1' },
      meta: { page: 1, pages: 7, totalPages: 7 },
    });
    const withoutMeta = responseHarness();
    ApiResponse.success(withoutMeta, { id: 'booking-2' });
    expect(withoutMeta.body).toEqual({ success: true, data: { id: 'booking-2' } });
  });

  it('maps operational errors to stable codes and structured validation errors', () => {
    const req = { id: 'request-456' };
    const res = responseHarness();
    errorHandler(
      new ApiError(409, 'Selected dates are not available', 'ITEM_UNAVAILABLE', [
        { path: 'items.0.startDate', message: 'Choose another date' },
      ]),
      req,
      res,
      jest.fn()
    );
    expect(res.statusCode).toBe(409);
    expect(res.body).toEqual({
      success: false,
      error: {
        code: 'ITEM_UNAVAILABLE',
        message: 'Selected dates are not available',
        details: [{ path: 'items.0.startDate', message: 'Choose another date' }],
      },
    });
  });

  it('preserves object details in the nested error envelope', () => {
    const res = responseHarness();
    errorHandler(
      new ApiError(503, 'Service is not ready', 'NOT_READY', { database: 'unavailable' }),
      { id: 'request-ready' },
      res,
      jest.fn()
    );
    expect(res.body).toEqual({
      success: false,
      error: {
        code: 'NOT_READY',
        message: 'Service is not ready',
        details: { database: 'unavailable' },
      },
    });
  });

  it('accepts the legacy ApiError details-first constructor form', () => {
    const error = new ApiError(400, 'Invalid date', { code: 'INVALID_DATES' });
    expect(error.code).toBe('INVALID_DATES');
    expect(error.details).toEqual({ code: 'INVALID_DATES' });
  });

  it('returns a friendly duplicate-key field error without including the value', () => {
    const res = responseHarness();
    errorHandler(
      Object.assign(new Error('duplicate'), { code: 11000, keyPattern: { email: 1 }, keyValue: { email: 'private@example.test' } }),
      { id: 'request-789' },
      res,
      jest.fn()
    );
    expect(res.statusCode).toBe(409);
    expect(res.body.error.details).toEqual([{ path: 'email', message: 'email must be unique' }]);
    expect(JSON.stringify(res.body)).not.toContain('private@example.test');
  });

  it('masks internal server errors while preserving a request ID', () => {
    const res = responseHarness();
    errorHandler(new Error('internal secret'), { id: 'request-999' }, res, jest.fn());
    expect(res.statusCode).toBe(500);
    expect(res.body).toMatchObject({
      success: false,
      error: {
        message: 'Something went wrong',
        code: 'INTERNAL_ERROR',
      },
    });
    expect(JSON.stringify(res.body)).not.toContain('internal secret');
  });

  it('validates reusable primitives including actual calendar dates', () => {
    expect(rentalDate.safeParse('2028-02-29').success).toBe(true);
    expect(rentalDate.safeParse('2027-02-29').success).toBe(false);
    expect(pincode.safeParse('110001').success).toBe(true);
    expect(pincode.safeParse('012345').success).toBe(false);
    expect(phoneIN.parse('9876543210')).toBe('+919876543210');
    expect(objectId.safeParse('507f1f77bcf86cd799439011').success).toBe(true);
    expect(paise.safeParse(2500).success).toBe(true);
    expect(paise.safeParse(-1).success).toBe(false);
    expect(paginationQuery.parse({}).limit).toBe(20);
    expect(slug.parse('Summer-Dress')).toBe('summer-dress');
  });
});
