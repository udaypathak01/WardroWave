import { describe, expect, it } from '@jest/globals';
import {
  productCreateSchema,
  productUpdateSchema,
  variantCreateSchema,
} from '../../src/validators/adminCatalog.validator.js';

describe('admin catalog validation', () => {
  it('accepts safe paise prices and rejects fractional prices', () => {
    const valid = productCreateSchema.parse({
      title: 'Evening Dress',
      description: 'Formal wear',
      category: '000000000000000000000001',
      gender: 'women',
      pricing: {
        basePrice: 12500,
        extraDayPrice: 1500,
        securityDeposit: 50000,
      },
    });
    expect(valid.pricing.minRentalDays).toBe(3);
    expect(() => productCreateSchema.parse({
      title: 'Evening Dress',
      description: 'Formal wear',
      category: '000000000000000000000001',
      gender: 'women',
      pricing: {
        basePrice: 125.5,
        extraDayPrice: 1500,
        securityDeposit: 50000,
      },
    })).toThrow();
  });

  it('does not inject create defaults when only updating one nested price field', () => {
    expect(productUpdateSchema.parse({ pricing: { basePrice: 16000 } })).toEqual({
      pricing: { basePrice: 16000 },
    });
  });

  it('rejects duplicate physical unit codes regardless of casing', () => {
    expect(() => variantCreateSchema.parse({
      sku: 'DRESS-XS',
      size: 'XS',
      color: 'Red',
      unitCodes: ['dress-01', 'DRESS-01'],
    })).toThrow();
  });
});
