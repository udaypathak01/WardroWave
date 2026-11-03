import { z } from 'zod';
import { objectId, phoneIN, pincode } from './common.validator.js';

const addressSchema = z.object({
  label: z.string().trim().min(1).max(40),
  fullName: z.string().trim().min(1).max(120),
  phone: phoneIN,
  line1: z.string().trim().min(1).max(200),
  line2: z.string().trim().max(200).optional(),
  landmark: z.string().trim().max(200).optional(),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().min(1).max(100),
  pincode,
  isDefault: z.boolean().optional(),
}).strict();

export const addressSchemaValidator = addressSchema;
export const addressUpdateSchema = addressSchema.partial();
export const profileUpdateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  phone: phoneIN.optional(),
  measurements: z.object({
    heightCm: z.number().positive().max(300).optional(),
    bustCm: z.number().positive().max(300).optional(),
    waistCm: z.number().positive().max(300).optional(),
    hipsCm: z.number().positive().max(300).optional(),
    preferredSize: z.string().trim().max(20).optional(),
  }).strict().optional(),
}).strict();
export const addressParamsSchema = z.object({
  addressId: objectId,
});
export const userParamsSchema = z.object({
  id: objectId,
});
export const userAccessSchema = z.object({
  role: z.enum(['customer', 'staff', 'admin', 'superadmin']).optional(),
  status: z.enum(['active', 'blocked']).optional(),
}).strict().refine((value) => value.role || value.status, 'Provide a role or status change');
export const notificationsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: objectId.optional(),
}).strict();
export const notificationParamsSchema = z.object({
  notificationId: objectId,
});
export const wardrobeImageParamsSchema = z.object({
  imageId: objectId,
});
