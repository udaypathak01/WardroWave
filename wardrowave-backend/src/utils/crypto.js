import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Creates a SHA-256 HMAC digest in the requested encoding.
 */
export function hmacSha256(value, secret, encoding = 'hex') {
  return createHmac('sha256', secret).update(value).digest(encoding);
}

/**
 * Compares two hexadecimal HMACs without leaking equality through timing.
 */
export function timingSafeCompareHex(expected, provided) {
  if (typeof expected !== 'string' || typeof provided !== 'string') return false;
  if (!/^[\da-f]+$/i.test(expected) || !/^[\da-f]+$/i.test(provided)) return false;
  const expectedBuffer = Buffer.from(expected, 'hex');
  const providedBuffer = Buffer.from(provided, 'hex');
  return expectedBuffer.length === providedBuffer.length &&
    timingSafeEqual(expectedBuffer, providedBuffer);
}
