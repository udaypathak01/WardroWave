import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i);
const paise = z.number().int().nonnegative().refine(Number.isSafeInteger);
const couponFields = {
  description: z.string().trim().max(500).optional(),
  type: z.enum(['percent', 'flat']),
  value: z.number().int().nonnegative().refine(Number.isSafeInteger),
  maxDiscount: paise.nullable().optional(),
  minRentalSubtotal: paise,
  startsAt: z.string().datetime({ offset: true }),
  expiresAt: z.string().datetime({ offset: true }),
  usageLimit: z.number().int().positive().nullable().optional(),
  perUserLimit: z.number().int().positive(),
  applicableCategories: z.array(objectId).max(100),
  applicableProducts: z.array(objectId).max(500),
  firstBookingOnly: z.boolean(),
  isActive: z.boolean(),
};

function validCoupon(value) {
  return new Date(value.expiresAt) > new Date(value.startsAt) &&
    (value.type !== 'percent' || value.value <= 100);
}

export const couponCreateSchema = z.object({
  code: z.string().trim().min(2).max(40).regex(/^[a-zA-Z0-9_-]+$/),
  description: couponFields.description,
  type: couponFields.type,
  value: couponFields.value,
  maxDiscount: couponFields.maxDiscount,
  minRentalSubtotal: paise.default(0),
  startsAt: couponFields.startsAt,
  expiresAt: couponFields.expiresAt,
  usageLimit: couponFields.usageLimit,
  perUserLimit: z.number().int().positive().default(1),
  applicableCategories: z.array(objectId).max(100).default([]),
  applicableProducts: z.array(objectId).max(500).default([]),
  firstBookingOnly: z.boolean().default(false),
  isActive: z.boolean().default(true),
}).strict().refine(validCoupon, 'Coupon dates or percentage value are invalid');

export const couponUpdateSchema = z.object({
  description: couponFields.description,
  startsAt: couponFields.startsAt,
  expiresAt: couponFields.expiresAt,
  usageLimit: couponFields.usageLimit,
  perUserLimit: couponFields.perUserLimit.optional(),
  maxDiscount: couponFields.maxDiscount,
  isActive: couponFields.isActive,
}).strict().refine((value) => Object.keys(value).length > 0, 'At least one coupon field is required');

export const couponParamsSchema = z.object({ couponId: objectId });
