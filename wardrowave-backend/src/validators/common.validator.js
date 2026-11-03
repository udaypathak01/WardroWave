import { z } from 'zod';

const isRealCalendarDate = (value) => {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;
};

export const objectId = z.string().trim().regex(/^[a-f\d]{24}$/i, 'Must be a valid object ID');
export const rentalDate = z.string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must use YYYY-MM-DD format')
  .refine(isRealCalendarDate, 'Date must be a real calendar date');
export const pincode = z.string().trim().regex(/^[1-9]\d{5}$/, 'Pincode must be a valid six-digit Indian pincode');
export const phoneIN = z.string()
  .trim()
  .regex(/^(?:\+91)?[6-9]\d{9}$/, 'Phone number must be a valid Indian mobile number')
  .transform((value) => value.startsWith('+91') ? value : `+91${value}`);
export const paise = z.number().int().safe().nonnegative();
export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
}).strict();
export const slug = z.string()
  .trim()
  .min(1)
  .max(180)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i, 'Must be a valid slug')
  .transform((value) => value.toLowerCase());
