import { describe, expect, it } from '@jest/globals';
import {
  computeBlockWindow,
  countRentalDays,
  parseRentalDate,
  validateRentalWindow,
} from '../../src/utils/dates.js';

describe('rental date utilities', () => {
  it('accepts only strict YYYY-MM-DD rental dates and normalizes midnight IST to UTC', () => {
    expect(parseRentalDate('2026-11-10').toISOString()).toBe('2026-11-09T18:30:00.000Z');
    expect(() => parseRentalDate('2026-2-10')).toThrow();
    expect(() => parseRentalDate('2026-02-30')).toThrow();
  });

  it('counts rental days inclusively', () => {
    expect(countRentalDays('2026-11-10', '2026-11-13')).toBe(4);
    expect(() => countRentalDays('2026-11-14', '2026-11-13')).toThrow();
  });

  it('computes a buffered block window', () => {
    const window = computeBlockWindow('2026-11-10', '2026-11-13', 1, 2);
    expect(window.blockStart.toISOString()).toBe('2026-11-08T18:30:00.000Z');
    expect(window.blockEnd.toISOString()).toBe('2026-11-14T18:30:00.000Z');
  });

  it('enforces rental duration, minimum lead and maximum advance rules', () => {
    const product = { pricing: { minRentalDays: 3, maxRentalDays: 14 } };
    const now = new Date('2026-11-01T00:00:00.000Z');
    expect(validateRentalWindow('2026-11-04', '2026-11-06', product, now).rentalDays).toBe(3);
    expect(() => validateRentalWindow('2026-11-02', '2026-11-04', product, now)).toThrow(/at least/);
    expect(() => validateRentalWindow('2026-11-04', '2026-11-04', product, now)).toThrow(/at least 3 days/);
    expect(() => validateRentalWindow('2027-05-01', '2027-05-03', product, now)).toThrow(/more than 180 days/);
  });
});
