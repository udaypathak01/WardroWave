import { describe, expect, it } from '@jest/globals';
import { Product } from '../../src/models/Product.js';

describe('paise schema fields', () => {
  it('rejects fractional and unsafe product prices', () => {
    const product = new Product({
      title: 'Test Dress',
      slug: 'test-dress',
      description: 'Test',
      category: '000000000000000000000001',
      gender: 'women',
      pricing: {
        basePrice: 100.5,
        extraDayPrice: Number.MAX_SAFE_INTEGER + 1,
        securityDeposit: 0,
      },
    });

    const error = product.validateSync();
    expect(error.errors['pricing.basePrice']).toBeDefined();
    expect(error.errors['pricing.extraDayPrice']).toBeDefined();
  });
});
