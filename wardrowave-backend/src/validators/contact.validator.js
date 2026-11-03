import { z } from 'zod';

const singleLine = (max) => z.string()
  .trim()
  .min(1)
  .max(max)
  .refine((value) => !/[\r\n]/.test(value), 'Line breaks are not allowed');

export const contactMessageSchema = z.object({
  name: singleLine(120),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(20).optional(),
  subject: singleLine(160),
  message: z.string().trim().min(1).max(5000),
}).strict();
