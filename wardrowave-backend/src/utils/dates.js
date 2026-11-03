import {
  addDays,
  differenceInCalendarDays,
  format,
  isBefore,
} from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { ApiError } from './ApiError.js';
import { env } from '../config/env.js';

const IST_TZ = 'Asia/Kolkata';
const RENTAL_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/**
 * Parses an ISO calendar date and returns midnight IST represented as UTC.
 */
export function parseRentalDate(input) {
  if (typeof input !== 'string' || !RENTAL_DATE_PATTERN.test(input)) {
    throw new ApiError(400, 'Date must use YYYY-MM-DD format', { code: 'INVALID_DATES' });
  }

  const [year, month, day] = input.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    throw new ApiError(400, 'Date is not a valid calendar date', { code: 'INVALID_DATES' });
  }

  const utcMidnight = Date.UTC(
    parsed.getUTCFullYear(),
    parsed.getUTCMonth(),
    parsed.getUTCDate()
  );
  return new Date(utcMidnight - IST_OFFSET_MS);
}

/**
 * Converts a date into its UTC instant for midnight on the corresponding IST calendar day.
 */
export function normalizeCalendarDate(value) {
  if (typeof value === 'string' && RENTAL_DATE_PATTERN.test(value)) {
    return parseRentalDate(value);
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ApiError(400, 'Invalid calendar date', { code: 'INVALID_DATES' });
  }

  const zoned = toZonedTime(date, IST_TZ);
  return parseRentalDate(format(zoned, 'yyyy-MM-dd'));
}

/**
 * Counts rental days inclusively and rejects an end date before the start date.
 */
export function countRentalDays(startDate, endDate) {
  const start = normalizeCalendarDate(startDate);
  const end = normalizeCalendarDate(endDate);
  const difference = differenceInCalendarDays(end, start);
  if (difference < 0) {
    throw new ApiError(400, 'Rental end date must be on or after the start date', {
      code: 'INVALID_DATES',
    });
  }
  return difference + 1;
}

/**
 * Returns the calendar-day difference from the start date to the end date.
 */
export function differenceInDays(startDate, endDate) {
  const start = normalizeCalendarDate(startDate);
  const end = normalizeCalendarDate(endDate);
  return differenceInCalendarDays(end, start);
}

/**
 * Expands the customer rental dates by transit and cleaning buffers.
 */
export function computeBlockWindow(startDate, endDate, deliveryBufferDays, returnBufferDays) {
  const start = normalizeCalendarDate(startDate);
  const end = normalizeCalendarDate(endDate);
  countRentalDays(start, end);

  if (
    !Number.isInteger(deliveryBufferDays) ||
    deliveryBufferDays < 0 ||
    !Number.isInteger(returnBufferDays) ||
    returnBufferDays < 0
  ) {
    throw new TypeError('Reservation buffers must be non-negative whole days');
  }

  return {
    blockStart: addDays(start, -deliveryBufferDays),
    blockEnd: addDays(end, returnBufferDays),
  };
}

/**
 * Validates rental duration and booking lead and advance limits.
 */
export function validateRentalWindow(startDate, endDate, product, now = new Date(), settings = {}) {
  const start = normalizeCalendarDate(startDate);
  const end = normalizeCalendarDate(endDate);
  const days = countRentalDays(start, end);
  const nowDate = now instanceof Date ? now : new Date(now);
  if (Number.isNaN(nowDate.getTime())) {
    throw new TypeError('Current date is invalid');
  }

  const today = normalizeCalendarDate(nowDate);
  const minimumLeadDays = Number(settings.minLeadDays ?? env.MIN_LEAD_DAYS);
  const maximumAdvanceDays = Number(settings.maxAdvanceDays ?? env.MAX_ADVANCE_DAYS);
  const earliest = addDays(today, minimumLeadDays);
  const latest = addDays(today, maximumAdvanceDays);
  const pricing = product?.pricing ?? product ?? {};
  const minDays = Number(pricing.minRentalDays ?? 3);
  const maxDays = Number(pricing.maxRentalDays ?? 14);

  let message;
  if (start < earliest) {
    message = `Rental start date must be at least ${minimumLeadDays} days from today`;
  } else if (start > latest) {
    message = `Rental start date cannot be more than ${maximumAdvanceDays} days in advance`;
  } else if (days < minDays) {
    message = `Rental must be at least ${minDays} days`;
  } else if (days > maxDays) {
    message = `Rental cannot exceed ${maxDays} days`;
  }

  if (message) {
    throw new ApiError(400, message, { code: 'INVALID_DATES' });
  }

  return { startDate: start, endDate: end, rentalDays: days };
}

/**
 * Adds a number of days to a normalized IST calendar date.
 */
export function addCalendarDays(value, days) {
  if (!Number.isInteger(days)) {
    throw new TypeError('Calendar-day offset must be an integer');
  }
  return addDays(normalizeCalendarDate(value), days);
}

/**
 * Indicates whether a calendar date is before the current IST calendar day.
 */
export function isPastDate(value, now = new Date()) {
  return isBefore(normalizeCalendarDate(value), normalizeCalendarDate(now));
}

/**
 * Formats a date using its Asia/Kolkata calendar day.
 */
export function formatRentalDate(value) {
  return format(toZonedTime(value, IST_TZ), 'yyyy-MM-dd');
}
