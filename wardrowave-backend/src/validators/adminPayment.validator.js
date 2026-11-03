import { z } from 'zod';

export const adminRefundSchema = z.object({
  amount: z.number().int().positive().safe(),
  notes: z.string().trim().min(1).max(500),
}).strict();
