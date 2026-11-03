import mongoSanitize from 'express-mongo-sanitize';

/** Removes MongoDB operator keys from incoming request data. */
export const sanitizeMiddleware = mongoSanitize();
