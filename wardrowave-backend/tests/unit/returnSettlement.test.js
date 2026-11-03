import { describe, expect, it } from '@jest/globals';
import { calculateReturnSettlement } from '../../src/utils/returnSettlement.js';

const bookingItems = [{
  _id: '000000000000000000000001',
  product: '000000000000000000000002',
  endDate: '2025-01-01',
}];
const products = [{
  _id: '000000000000000000000002',
  pricing: { extraDayPrice: 1000 },
}];

describe('return settlement pricing', () => {
  it('calculates late fees and caps deductions at the refundable deposit', () => {
    const result = calculateReturnSettlement({
      bookingItems,
      products,
      assessments: [{
        itemId: bookingItems[0]._id,
        damageLevel: 'minor',
        damageCharge: 10000,
        notes: 'Small stain',
        photos: ['https://images.example.test/damage.jpg'],
      }],
      receivedAt: '2025-01-04T12:00:00+05:30',
      lateFeeMultiplier: 1.5,
      depositTotal: 20000,
    });

    expect(result.maxLateDays).toBe(3);
    expect(result.totalLateFee).toBe(4500);
    expect(result.totalDamageCharge).toBe(10000);
    expect(result.depositDeducted).toBe(14500);
    expect(result.depositRefunded).toBe(5500);
    expect(result.outstandingAmount).toBe(0);
    expect(result.damageLevel).toBe('minor');
  });

  it('reports an outstanding balance when deductions exceed the deposit', () => {
    const result = calculateReturnSettlement({
      bookingItems,
      products,
      assessments: [{
        itemId: bookingItems[0]._id,
        damageLevel: 'lost',
        damageCharge: 20000,
      }],
      receivedAt: '2025-01-01T12:00:00+05:30',
      lateFeeMultiplier: 1.5,
      depositTotal: 1000,
    });

    expect(result.depositRefunded).toBe(0);
    expect(result.depositDeducted).toBe(1000);
    expect(result.outstandingAmount).toBe(19000);
    expect(result.damageLevel).toBe('lost');
  });
});
