import { z } from 'zod';

export const wishlistProductParamsSchema = z.object({
  productId: z.string().regex(/^[a-f\d]{24}$/i),
});
