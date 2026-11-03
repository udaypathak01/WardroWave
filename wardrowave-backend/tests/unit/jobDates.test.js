import { describe, expect, it } from '@jest/globals';
import { addIstDays, formatIstDate, istDayRange, istDayStart } from '../../src/jobs/jobDates.js';

describe('scheduled job calendar dates', () => {
  it('uses Asia/Kolkata calendar days at midnight boundaries', () => {
    const instant = new Date('2026-11-01T20:00:00.000Z');
    const today = istDayStart(instant);

    expect(formatIstDate(today)).toBe('2026-11-02');
    expect(formatIstDate(addIstDays(today, 1))).toBe('2026-11-03');
    expect(today.toISOString()).toBe('2026-11-01T18:30:00.000Z');
  });

  it('returns a half-open date range for the requested reminder day', () => {
    const { start, end } = istDayRange(new Date('2026-11-01T08:00:00.000Z'), 2);

    expect(formatIstDate(start)).toBe('2026-11-03');
    expect(end.getTime() - start.getTime()).toBe(24 * 60 * 60 * 1000);
    expect(formatIstDate(end)).toBe('2026-11-04');
  });
});
