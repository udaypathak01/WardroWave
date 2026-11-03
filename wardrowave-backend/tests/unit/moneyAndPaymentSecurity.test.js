import { describe, expect, it } from '@jest/globals';
import { timingSafeCompareHex } from '../../src/utils/crypto.js';
import {
  formatINR,
  fromPaise,
  multiplyPaiseByRate,
  sumPaise,
  toPaise,
} from '../../src/utils/money.js';
import { acceptRazorpayWebhook, verifyPayment } from '../../src/services/payment.service.js';

describe('currency and payment integrity utilities', () => {
  it('converts and formats money using integer paise', () => {
    expect(toPaise('120.50')).toBe(12050);
    expect(toPaise(1.005)).toBe(101);
    expect(toPaise('-1.005')).toBe(-101);
    expect(fromPaise(12050)).toBe(120.5);
    expect(formatINR(12050)).toContain('120.50');
    expect(() => toPaise('not money')).toThrow();
    expect(() => fromPaise(1.5)).toThrow();
  });

  it('performs paise multiplication and aggregation with safe integer arithmetic', () => {
    expect(multiplyPaiseByRate(101, 1.5)).toBe(152);
    expect(multiplyPaiseByRate(101, 0.5)).toBe(51);
    expect(sumPaise([120, 80])).toBe(200);
    expect(() => multiplyPaiseByRate(-1, 1.5)).toThrow();
    expect(() => sumPaise([Number.MAX_SAFE_INTEGER, 1])).toThrow();
  });

  it('compares valid HMAC hex values in constant time and rejects malformed values', () => {
    const signature = 'a'.repeat(64);
    expect(timingSafeCompareHex(signature, signature)).toBe(true);
    expect(timingSafeCompareHex(signature, 'b'.repeat(64))).toBe(false);
    expect(timingSafeCompareHex(signature, 'z'.repeat(64))).toBe(false);
    expect(timingSafeCompareHex(signature, 'a'.repeat(62))).toBe(false);
  });

  it('rejects invalid checkout signatures before querying payments', async () => {
    await expect(
      verifyPayment({
        userId: '000000000000000000000000',
        orderId: 'order_test',
        paymentId: 'payment_test',
        signature: '0'.repeat(64),
      })
    ).rejects.toMatchObject({ statusCode: 400, code: 'INVALID_PAYMENT_SIGNATURE' });
  });

  it('rejects invalid raw-body webhook signatures before persisting events', async () => {
    await expect(
      acceptRazorpayWebhook({
        rawBody: Buffer.from('{"event":"payment.captured"}'),
        eventId: 'event-test',
        signature: '0'.repeat(64),
      })
    ).rejects.toMatchObject({ statusCode: 400, code: 'INVALID_WEBHOOK_SIGNATURE' });
  });
});
