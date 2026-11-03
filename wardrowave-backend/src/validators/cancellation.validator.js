import { z } from 'zod';

export const cancellationSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});
