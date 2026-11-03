import { describe, expect, it } from '@jest/globals';
import { env } from '../../src/config/env.js';
import { calculateQuote, calculateRentalCharge, quote } from '../../src/services/pricing.service.js';

const item = {
  product: {
    _id: 'product1',
    title: 'Party outfit',
    category: 'category1',
    pricing: {
      basePrice: 10000,
      extraDayPrice: 2000,
      securityDeposit: 5000,
      minRentalDays: 3,
      maxRentalDays: 14,
    },
  },
  variant: { _id: 'variant1' },
  startDate: '2026-11-10',
  endDate: '2026-11-13',
  available: true,
  availableCount: 1,
};

describe('rental quote', () => {
  it('uses the base price through minimum days and adds only additional-day rates', () => {
    expect(calculateRentalCharge(item.product, 1)).toBe(10_000);
    expect(calculateRentalCharge(item.product, 3)).toBe(10_000);
    expect(calculateRentalCharge(item.product, 5)).toBe(14_000);
    expect(() => calculateRentalCharge(item.product, 0)).toThrow(/positive whole number/);
    expect(() => calculateRentalCharge({ pricing: { ...item.product.pricing, basePrice: -1 } }, 3))
      .toThrow(/basePrice/);
    expect(() => calculateRentalCharge({ pricing: { ...item.product.pricing, minRentalDays: 0 } }, 3))
      .toThrow(/Minimum rental duration/);
  });

  it('marks reversed, too-short, and too-long rental windows invalid without charging them differently', () => {
    const invalidWindows = [
      { startDate: '2026-11-13', endDate: '2026-11-10' },
      { startDate: '2026-11-10', endDate: '2026-11-11' },
      { startDate: '2026-11-10', endDate: '2026-11-24' },
    ];

    for (const dates of invalidWindows) {
      const result = quote({
        items: [{ ...item, ...dates }],
        settings: { gstPercent: 0, deliveryFee: 0, freeDeliveryAbove: 500_000 },
      });
      expect(result.items[0].failureReason).toBe('dates_invalid');
      expect(result.failureReason).toBe('dates_invalid');
      expect(result.available).toBe(false);
    }
  });

  it('applies coupon eligibility limits before calculating a discount', () => {
    const now = new Date('2026-11-01T00:00:00Z');
    const valid = {
      code: 'LIMITED',
      type: 'flat',
      value: 1000,
      startsAt: new Date('2026-01-01T00:00:00Z'),
      expiresAt: new Date('2027-01-01T00:00:00Z'),
      isActive: true,
    };
    const invalidCases = [
      [null, undefined, undefined],
      [{ ...valid, isActive: false }, undefined, undefined],
      [{ ...valid, deletedAt: now }, undefined, undefined],
      [{ ...valid, startsAt: new Date('2026-12-01T00:00:00Z') }, undefined, undefined],
      [{ ...valid, expiresAt: new Date('2026-10-01T00:00:00Z') }, undefined, undefined],
      [{ ...valid, minRentalSubtotal: 500_000 }, undefined, undefined],
      [{ ...valid, usageLimit: 1, usedCount: 1 }, undefined, undefined],
      [{ ...valid, firstBookingOnly: true }, { bookingCount: 1 }, undefined],
      [{ ...valid, perUserLimit: 1 }, { couponRedemptionCount: 1 }, undefined],
      [{ ...valid, applicableProducts: ['another-product'] }, undefined, undefined],
      [{ ...valid, applicableCategories: ['another-category'] }, undefined, undefined],
    ];

    for (const [coupon, user] of invalidCases) {
      const result = quote({
        items: [item],
        couponCode: 'LIMITED',
        coupon,
        user,
        now,
        settings: { gstPercent: 0, deliveryFee: 0, freeDeliveryAbove: 500_000 },
      });
      expect(result.failureReason).toBe('coupon_invalid');
      expect(result.discount).toBe(0);
    }
  });

  it('discounts only the coupon-eligible lines and caps a flat discount to their rental charge', () => {
    const secondItem = {
      ...item,
      product: { ...item.product, _id: 'product2', category: 'category2' },
      variant: { _id: 'variant2' },
    };
    const result = quote({
      items: [item, secondItem],
      couponCode: 'ONEPRODUCT',
      coupon: {
        code: 'ONEPRODUCT',
        type: 'flat',
        value: 50_000,
        applicableProducts: ['product1'],
        startsAt: new Date('2026-01-01T00:00:00Z'),
        expiresAt: new Date('2027-01-01T00:00:00Z'),
        isActive: true,
      },
      now: new Date('2026-11-01T00:00:00Z'),
      settings: { gstPercent: 0, deliveryFee: 0, freeDeliveryAbove: 500_000 },
    });

    expect(result.rentalSubtotal).toBe(24_000);
    expect(result.discount).toBe(12_000);
    expect(result.couponCode).toBe('ONEPRODUCT');
    expect(result.taxableAmount).toBe(12_000);
  });

  it('rejects invalid coupon values and percentage rates above 100', () => {
    const validDates = {
      startsAt: new Date('2026-01-01T00:00:00Z'),
      expiresAt: new Date('2027-01-01T00:00:00Z'),
      isActive: true,
    };
    expect(() => quote({
      items: [item],
      couponCode: 'INVALID',
      coupon: { ...validDates, code: 'INVALID', type: 'flat', value: -1 },
    })).toThrow(/non-negative whole number/);
    expect(() => quote({
      items: [item],
      couponCode: 'INVALID',
      coupon: { ...validDates, code: 'INVALID', type: 'percent', value: 101 },
    })).toThrow(/cannot exceed 100/);
  });

  it('calculates inclusive rental days, tax, deposit, and total in paise', () => {
    const result = quote({
      items: [item],
      settings: { gstPercent: 12, deliveryFee: 9900, freeDeliveryAbove: 500000 },
    });

    expect(result.items[0].rentalDays).toBe(4);
    expect(result.items[0].rentalCharge).toBe(12000);
    expect(result.rentalSubtotal).toBe(12000);
    expect(result.deliveryFee).toBe(9900);
    expect(result.taxableAmount).toBe(21900);
    expect(result.gstAmount).toBe(2628);
    expect(result.depositTotal).toBe(5000);
    expect(result.grandTotal).toBe(29528);
    expect(result.failureReason).toBeNull();
  });

  it('applies discounts only to rental charges and reports the first availability failure', () => {
    const result = quote({
      items: [{ ...item, available: false, availableCount: 0 }],
      couponCode: 'TENPERCENT',
      coupon: {
        code: 'TENPERCENT',
        type: 'percent',
        value: 10,
        startsAt: new Date('2026-01-01T00:00:00Z'),
        expiresAt: new Date('2027-01-01T00:00:00Z'),
        isActive: true,
      },
      pincodeServiceable: false,
      settings: { gstPercent: 0, deliveryFee: 0, freeDeliveryAbove: 500000 },
      now: new Date('2026-11-01T00:00:00Z'),
    });

    expect(result.discount).toBe(1200);
    expect(result.taxableAmount).toBe(10800);
    expect(result.depositTotal).toBe(5000);
    expect(result.failureReason).toBe('size_unavailable');
  });

  it('marks dates as unavailable and prioritizes date errors over later checks', () => {
    const result = quote({
      items: [{ ...item, dateValid: false, available: null, availableCount: null }],
      pincodeServiceable: false,
      settings: { gstPercent: 0, deliveryFee: 0, freeDeliveryAbove: 500000 },
    });

    expect(result.failureReason).toBe('dates_invalid');
    expect(result.available).toBe(false);
  });

  it('caps percentage discounts and excludes the security deposit from taxable totals', () => {
    const result = quote({
      items: [item],
      couponCode: 'TENPERCENT',
      coupon: {
        code: 'TENPERCENT',
        type: 'percent',
        value: 10,
        maxDiscount: 500,
        startsAt: new Date('2026-01-01T00:00:00Z'),
        expiresAt: new Date('2027-01-01T00:00:00Z'),
        isActive: true,
      },
      settings: { gstPercent: 12, deliveryFee: 9900, freeDeliveryAbove: 500000 },
      now: new Date('2026-11-01T00:00:00Z'),
    });

    expect(result.discount).toBe(500);
    expect(result.taxableAmount).toBe(21_400);
    expect(result.gstAmount).toBe(2_568);
    expect(result.depositTotal).toBe(5_000);
    expect(result.grandTotal).toBe(28_968);
  });

  it('applies flat rental discounts and waives delivery at the exact free-delivery threshold', () => {
    const result = quote({
      items: [{ ...item, product: { ...item.product, pricing: { ...item.product.pricing, basePrice: 500_000 } } }],
      couponCode: 'FLAT',
      coupon: {
        code: 'FLAT',
        type: 'flat',
        value: 10_000,
        startsAt: new Date('2026-01-01T00:00:00Z'),
        expiresAt: new Date('2027-01-01T00:00:00Z'),
        isActive: true,
      },
      settings: { gstPercent: 0, deliveryFee: 9900, freeDeliveryAbove: 492_000 },
      now: new Date('2026-11-01T00:00:00Z'),
    });

    expect(result.discount).toBe(10_000);
    expect(result.deliveryFee).toBe(0);
    expect(result.taxableAmount).toBe(492_000);
  });

  it('rounds GST to paise and rejects malformed quote values', () => {
    const rounded = quote({
      items: [{ ...item, product: { ...item.product, pricing: { ...item.product.pricing, basePrice: 101 } }, endDate: '2026-11-12' }],
      settings: { gstPercent: 50, deliveryFee: 0, freeDeliveryAbove: 500_000 },
    });
    expect(rounded.taxableAmount).toBe(101);
    expect(rounded.gstAmount).toBe(51);

    expect(() => quote({ items: [] })).toThrow(/At least one quote item/);
    expect(() => quote({
      items: [item],
      settings: { gstPercent: 101, deliveryFee: 0, freeDeliveryAbove: 500_000 },
    })).toThrow(/GST percent/);
    expect(() => quote({
      items: [item],
      settings: { gstPercent: 0, deliveryFee: -1, freeDeliveryAbove: 500_000 },
    })).toThrow(/deliveryFee/);
    expect(() => calculateQuote(item.product, 3, -1)).toThrow(/deliveryFee/);

    expect(calculateQuote(item.product, 4, 9900)).toMatchObject({
      rentalCharge: 12_000,
      deliveryFee: 9900,
      taxableAmount: 21_900,
      gstPercent: env.GST_PERCENT,
      gstAmount: 2_628,
      total: 24_528,
    });
    const gstPercent = env.GST_PERCENT;
    env.GST_PERCENT = 101;
    try {
      expect(() => calculateQuote(item.product, 3)).toThrow(/GST percent/);
    } finally {
      env.GST_PERCENT = gstPercent;
    }
  });
});
