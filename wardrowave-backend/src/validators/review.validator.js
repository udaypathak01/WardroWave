import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i);
export const reviewProductParamsSchema = z.object({ productId: objectId });
export const reviewParamsSchema = z.object({ reviewId: objectId });
export const createReviewSchema = z.object({
  bookingId: objectId,
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().min(1).max(120),
  comment: z.string().trim().min(1).max(5000),
  fitFeedback: z.enum(['runs_small', 'true_to_size', 'runs_large']).optional(),
  images: z.array(z.string().url().refine((value) => value.startsWith('https://'))).max(3).default([]),
}).strict();
export const reviewListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
}).strict();
export const reviewModerationSchema = z.object({
  status: z.enum(['approved', 'rejected']),
}).strict();
