import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const userKey = (req) => req.user?._id?.toString() ?? 'unauthenticated';

function createLimiter({ windowMs, limit, keyGenerator }) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    ...(keyGenerator ? { keyGenerator } : {}),
    handler: (req, res, next) => {
      next(new ApiError(429, 'Too many requests', 'RATE_LIMITED'));
    },
  });
}

/**
 * Applies the configured global request-rate limit, excluding the signed webhook endpoint.
 */
export const globalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    const requestPath = req.originalUrl.split('?')[0];
    const webhookPath = `${env.API_PREFIX}/webhooks/razorpay`;
    return requestPath === webhookPath || requestPath.startsWith(`${webhookPath}/`);
  },
  handler: (req, res, next) => {
    next(new ApiError(429, 'Too many requests', 'RATE_LIMITED'));
  },
});

export const authSyncRateLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 20,
});

export const contactRateLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 5,
});

export const paymentVerifyRateLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  keyGenerator: userKey,
});

export const checkoutRateLimiter = createLimiter({
  windowMs: 10 * 60 * 1000,
  limit: 10,
  keyGenerator: userKey,
});

export const reviewRateLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 30,
  keyGenerator: userKey,
});

export const uploadRateLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 30,
  keyGenerator: userKey,
});

export const couponRateLimiter = createLimiter({
  windowMs: 10 * 60 * 1000,
  limit: 20,
  keyGenerator: userKey,
});

export const adminRateLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  keyGenerator: userKey,
});

export const adminSensitiveRateLimiter = createLimiter({
  windowMs: env.ADMIN_SENSITIVE_RATE_LIMIT_WINDOW_MS,
  limit: env.ADMIN_SENSITIVE_RATE_LIMIT_MAX,
  keyGenerator: userKey,
});

export const availabilityRateLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 60,
});
