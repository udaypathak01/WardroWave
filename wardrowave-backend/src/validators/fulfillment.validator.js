import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i);
const trackingSchema = z.object({
  carrier: z.string().trim().min(1).max(100),
  trackingNumber: z.string().trim().min(1).max(150),
}).strict();

export const dispatchSchema = trackingSchema;
export const receiveReturnSchema = trackingSchema;
export const returnRequestSchema = z.object({
  pickupAt: z.string().datetime({ offset: true }),
}).strict();
export const inspectionSchema = z.object({
  items: z.array(z.object({
    itemId: objectId,
    damageLevel: z.enum(['none', 'minor', 'major', 'lost']),
    damageCharge: z.number().int().nonnegative().refine(Number.isSafeInteger),
    notes: z.string().trim().max(2000).optional(),
    photos: z.array(z.string().url()).max(8).default([]),
  }).strict()).min(1).max(10),
}).strict();
export const inventoryUnitParamsSchema = z.object({ unitId: objectId });
