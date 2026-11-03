import { ApiError } from '../utils/ApiError.js';

/**
 * Forwards unmatched routes through the shared API error envelope.
 */
export function notFoundMiddleware(req, res, next) {
  next(new ApiError(404, 'Route not found', 'NOT_FOUND'));
}
