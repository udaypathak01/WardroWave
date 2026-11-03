import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i);
const paise = z.number().int().nonnegative().refine(Number.isSafeInteger);
const rentalDayCount = z.number().int().min(1).max(365);
const imageSchema = z.object({
  url: z.string().url().refine((value) => value.startsWith('https://')),
  publicId: z.string().trim().min(1).max(250).optional(),
  alt: z.string().trim().max(250).optional(),
  isPrimary: z.boolean().optional(),
  sortOrder: z.number().int().nonnegative().optional(),
}).strict();
const pricingFields = {
  retailValue: paise.optional(),
  basePrice: paise,
  extraDayPrice: paise,
  securityDeposit: paise,
  minRentalDays: rentalDayCount,
  maxRentalDays: rentalDayCount,
  deliveryBufferDays: z.number().int().min(0).max(30),
  returnBufferDays: z.number().int().min(0).max(30),
};
const pricingCreateSchema = z.object({
  ...pricingFields,
  minRentalDays: rentalDayCount.default(3),
  maxRentalDays: rentalDayCount.default(14),
  deliveryBufferDays: z.number().int().min(0).max(30).default(1),
  returnBufferDays: z.number().int().min(0).max(30).default(2),
});
const pricingUpdateSchema = z.object(pricingFields).partial().strict();

const productFields = {
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(20_000),
  brand: z.string().trim().max(100).optional(),
  category: objectId,
  gender: z.enum(['women', 'men', 'unisex', 'kids']),
  occasions: z.array(z.enum(['wedding', 'party', 'festive', 'cocktail', 'casual', 'formal'])).max(12),
  tags: z.array(z.string().trim().min(1).max(40)).max(30),
  colors: z.array(z.string().trim().min(1).max(40)).max(20),
  fabric: z.string().trim().max(100).optional(),
  careInstructions: z.array(z.string().trim().max(500)).max(20),
  fitNotes: z.array(z.string().trim().max(500)).max(20),
  images: z.array(imageSchema).max(8),
  pricing: pricingCreateSchema,
  sizeChart: z.array(z.object({
    size: z.string().trim().min(1).max(20),
    bust: z.number().positive().optional(),
    waist: z.number().positive().optional(),
    hips: z.number().positive().optional(),
    length: z.number().positive().optional(),
  }).strict()).max(30),
  status: z.enum(['draft', 'published', 'archived']),
  isFeatured: z.boolean(),
};
export const productCreateSchema = z.object({
  ...productFields,
  occasions: productFields.occasions.default([]),
  tags: productFields.tags.default([]),
  colors: productFields.colors.default([]),
  careInstructions: productFields.careInstructions.default([]),
  fitNotes: productFields.fitNotes.default([]),
  images: productFields.images.default([]),
  sizeChart: productFields.sizeChart.default([]),
  status: productFields.status.default('draft'),
  isFeatured: productFields.isFeatured.default(false),
}).strict().refine(
  (value) => value.pricing.maxRentalDays >= value.pricing.minRentalDays,
  'Maximum rental duration must not be less than minimum duration'
);

export const productUpdateSchema = z.object({
  ...productFields,
  pricing: pricingUpdateSchema.optional(),
}).partial().strict()
  .refine((value) => Object.keys(value).length > 0, 'At least one product field is required');

export const categoryCreateSchema = z.object({
  name: z.string().trim().min(1).max(100),
  parent: objectId.nullable().optional(),
  image: z.object({
    url: z.string().url().refine((value) => value.startsWith('https://')).optional(),
    publicId: z.string().trim().max(250).optional(),
  }).strict().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
}).strict();
export const categoryUpdateSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  parent: objectId.nullable().optional(),
  image: z.object({
    url: z.string().url().refine((value) => value.startsWith('https://')).optional(),
    publicId: z.string().trim().max(250).optional(),
  }).strict().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
}).strict().refine((value) => Object.keys(value).length > 0, 'At least one category field is required');

export const variantCreateSchema = z.object({
  sku: z.string().trim().min(1).max(100),
  size: z.string().trim().min(1).max(30),
  color: z.string().trim().min(1).max(50),
  unitCodes: z.array(z.string().trim().min(1).max(80)).min(1).max(100)
    .refine((codes) => new Set(codes.map((code) => code.toUpperCase())).size === codes.length),
}).strict();

export const inventoryStatusSchema = z.object({
  status: z.enum(['available', 'maintenance', 'retired']),
}).strict();

export const adminProductParamsSchema = z.object({ productId: objectId });
export const productImageOrderSchema = z.object({
  publicIds: z.array(z.string().trim().min(1).max(500)).min(1).max(8),
  primaryPublicId: z.string().trim().min(1).max(500),
}).strict();
export const productImageDeleteSchema = z.object({
  publicId: z.string().trim().min(1).max(500),
}).strict();
export const adminUnitParamsSchema = z.object({ unitId: objectId });
export const adminCategoryParamsSchema = z.object({ categoryId: objectId });
