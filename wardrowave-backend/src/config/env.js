import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const booleanEnv = (defaultValue) => z.preprocess(
  (value) => {
    if (typeof value !== 'string') return value;
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
    return value;
  },
  z.boolean().default(defaultValue)
);

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  API_PREFIX: z.string().regex(/^\/[a-zA-Z0-9/_-]*$/, 'API_PREFIX must be an absolute path').default('/api/v1'),
  ENABLE_DOCS: z.preprocess(
    (value) => {
      if (typeof value !== 'string') return value;
      if (value.toLowerCase() === 'true') return true;
      if (value.toLowerCase() === 'false') return false;
      return value;
    },
    z.boolean().default(false)
  ),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(10).default(0),
  MONGODB_URI: z
    .string()
    .min(1, 'MONGODB_URI is required')
    .regex(/^mongodb(\+srv)?:\/\/\S+$/, 'MONGODB_URI must be a MongoDB connection URI'),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:5173')
    .refine((value) => value.split(',').every((origin) => {
      try {
        const parsed = new URL(origin.trim());
        return ['http:', 'https:'].includes(parsed.protocol) && parsed.origin === origin.trim();
      } catch {
        return false;
      }
    }), 'CORS_ORIGINS must be comma-separated HTTP(S) origins'),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  CLOUDINARY_FOLDER: z.string()
    .regex(/^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*$/, 'CLOUDINARY_FOLDER must contain safe path segments')
    .default('wardrowave'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z.preprocess(
    (value) => {
      if (typeof value !== 'string') return value;
      if (value.toLowerCase() === 'true') return true;
      if (value.toLowerCase() === 'false') return false;
      return value;
    },
    z.boolean().default(false)
  ),
  REQUIRE_VERIFIED_EMAIL: z.preprocess(
    (value) => {
      if (typeof value !== 'string') return value;
      if (value.toLowerCase() === 'true') return true;
      if (value.toLowerCase() === 'false') return false;
      return value;
    },
    z.boolean().default(true)
  ),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().optional(),
  SUPPORT_EMAIL: z.string().email().default('support@wardrowave.in'),
  ADMIN_EMAILS: z.string().default(''),
  SUPERADMIN_EMAILS: z.string().default(''),
  ADMIN_REAUTH_MAX_AGE_SECONDS: z.coerce.number().int().positive().max(86_400).default(300),
  ADMIN_REQUIRE_MFA: booleanEnv(process.env.NODE_ENV === 'production'),
  ADMIN_SENSITIVE_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900_000),
  ADMIN_SENSITIVE_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(30),
  SEED_TEST_USER_EMAIL: z.preprocess(
    (value) => value === '' ? undefined : value,
    z.string().email().optional()
  ),
  APP_URL: z.string().url().default('http://localhost:5000'),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  MIN_LEAD_DAYS: z.coerce.number().int().nonnegative().default(2),
  MAX_ADVANCE_DAYS: z.coerce.number().int().positive().default(180),
  HOLD_MINUTES: z.coerce.number().int().positive().default(15),
  GST_PERCENT: z.coerce.number().int().nonnegative().default(12),
  DELIVERY_FEE: z.coerce.number().int().nonnegative().default(9900),
  FREE_DELIVERY_ABOVE: z.coerce.number().int().nonnegative().default(500000),
  LATE_FEE_MULTIPLIER: z.coerce.number().positive().default(1.5),
  FREE_CANCEL_HOURS: z.coerce.number().int().nonnegative().default(48),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent']).default('info'),
  OBSERVABILITY_ENABLED: z.preprocess(
    (value) => {
      if (typeof value !== 'string') return value;
      if (value.toLowerCase() === 'true') return true;
      if (value.toLowerCase() === 'false') return false;
      return value;
    },
    z.boolean().default(false)
  ),
}).superRefine((config, context) => {
  const optionalCredentialGroups = [
    ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'],
    ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET'],
    ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'],
  ];
  for (const group of optionalCredentialGroups) {
    const configuredCount = group.filter((key) => Boolean(config[key])).length;
    if (configuredCount > 0 && configuredCount < group.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: [group.find((key) => !config[key])],
        message: `Configure all or none of: ${group.join(', ')}`,
      });
    }
  }
  if (config.MAIL_FROM && !z.string().email().safeParse(config.MAIL_FROM).success) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['MAIL_FROM'],
      message: 'MAIL_FROM must be a valid email address',
    });
  }
  if (config.MAX_ADVANCE_DAYS < config.MIN_LEAD_DAYS) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['MAX_ADVANCE_DAYS'],
      message: 'MAX_ADVANCE_DAYS must be greater than or equal to MIN_LEAD_DAYS',
    });
  }
  if (config.NODE_ENV === 'production') {
    const required = [
      'FIREBASE_PROJECT_ID',
      'FIREBASE_CLIENT_EMAIL',
      'FIREBASE_PRIVATE_KEY',
      'RAZORPAY_KEY_ID',
      'RAZORPAY_KEY_SECRET',
      'RAZORPAY_WEBHOOK_SECRET',
      'CLOUDINARY_CLOUD_NAME',
      'CLOUDINARY_API_KEY',
      'CLOUDINARY_API_SECRET',
      'SMTP_HOST',
      'SMTP_USER',
      'SMTP_PASS',
      'MAIL_FROM',
    ];
    for (const key of required) {
      if (!config[key]) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message: `${key} is required in production`,
        });
      }
    }
    if (
      config.FIREBASE_PRIVATE_KEY &&
      !config.FIREBASE_PRIVATE_KEY.includes('-----BEGIN PRIVATE KEY-----')
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['FIREBASE_PRIVATE_KEY'],
        message: 'FIREBASE_PRIVATE_KEY must be a PEM private key',
      });
    }
  }
});

const parsedEnv = envSchema.safeParse(process.env);
if (!parsedEnv.success) {
  const issues = parsedEnv.error.issues
    .map((issue) => `${issue.path.join('.') || 'env'}: ${issue.message}`)
    .join('\n');
  throw new Error(`Invalid environment configuration:\n${issues}`);
}

export const env = parsedEnv.data;
export default env;
