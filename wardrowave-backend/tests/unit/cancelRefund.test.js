import { describe, expect, it } from '@jest/globals';
import { calculateCancellationRefund } from '../../src/utils/bookingPricing.js';

describe('calculateCancellationRefund', () => {
  it('returns full refund inside the free-cancel window', () => {
    const booking = {
      status: 'pending_payment',
      freeCancelHours: 48,
      items: [{ startDate: new Date(Date.now() + 1000 * 60 * 60 * 72) }],
      pricing: { rentalSubtotal: 120000 },
    };

    const result = calculateCancellationRefund(booking, new Date());
    expect(result.refundAmount).toBe(120000);
    expect(result.retainedAmount).toBe(0);
    expect(result.depositRefund).toBe(0);
    expect(result.isFreeCancellation).toBe(true);
  });

  it('retains half of rental charge when cancellation is late', () => {
    const booking = {
      status: 'pending_payment',
      freeCancelHours: 48,
      items: [{ startDate: new Date(Date.now() + 1000 * 60 * 60 * 8) }],
      pricing: { rentalSubtotal: 100000 },
    };

    const result = calculateCancellationRefund(booking, new Date());
    expect(result.refundAmount).toBe(50000);
    expect(result.retainedAmount).toBe(50000);
    expect(result.isFreeCancellation).toBe(false);
  });

  it('refunds the deposit in full on a valid cancellation', () => {
    const now = new Date('2026-01-01T00:00:00.000Z');
    const booking = {
      status: 'confirmed',
      freeCancelHours: 48,
      items: [{ startDate: new Date('2026-01-02T23:00:00.000Z') }],
      pricing: { rentalSubtotal: 100000, depositTotal: 25000 },
    };

    const result = calculateCancellationRefund(booking, now);
    expect(result.refundAmount).toBe(50000);
    expect(result.depositRefund).toBe(25000);
    expect(result.totalRefund).toBe(75000);
    expect(result.canCancel).toBe(true);
  });

  it('prevents cancellation once dispatched', () => {
    const booking = {
      status: 'dispatched',
      items: [{ startDate: new Date('2026-01-03T00:00:00.000Z') }],
      pricing: { rentalSubtotal: 100000, depositTotal: 25000 },
    };

    const result = calculateCancellationRefund(booking, new Date('2026-01-01T00:00:00.000Z'));
    expect(result.canCancel).toBe(false);
    expect(result.reason).toBe('already_dispatched');
    expect(result.totalRefund).toBe(0);
  });

  it('treats the exact free-cancellation boundary as refundable and always returns the deposit', () => {
    const now = new Date('2026-01-01T00:00:00.000Z');
    const booking = {
      status: 'confirmed',
      freeCancelHours: 48,
      items: [{ startDate: new Date('2026-01-03T00:00:00.000Z') }],
      pricing: { rentalSubtotal: 100001, depositTotal: 25000 },
    };

    const result = calculateCancellationRefund(booking, now);
    expect(result.refundable).toBe(100001);
    expect(result.retained).toBe(0);
    expect(result.deposit).toBe(25000);
    expect(result.totalRefund).toBe(125001);
  });

  it('rejects invalid cancellation input rather than returning a success-shaped value', () => {
    expect(() => calculateCancellationRefund({ items: [], pricing: {} }, new Date())).toThrow(
      'Booking items are required'
    );
  });

  it('calculates the refund from the discounted rental charge', () => {
    const booking = {
      status: 'confirmed',
      freeCancelHours: 48,
      items: [{ startDate: new Date('2026-01-02T00:00:00.000Z') }],
      pricing: { rentalSubtotal: 100000, discount: 10000, depositTotal: 25000 },
    };

    const result = calculateCancellationRefund(booking, new Date('2026-01-01T00:00:00.000Z'));
    expect(result.refundable).toBe(45000);
    expect(result.retained).toBe(45000);
    expect(result.deposit).toBe(25000);
    expect(result.totalRefund).toBe(70000);
  });
});
