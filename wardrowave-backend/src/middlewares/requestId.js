import crypto from 'node:crypto';

/**
 * Assigns a validated client request ID or generates a UUID for trace correlation.
 */
export function requestIdMiddleware(req, res, next) {
  const providedId = req.headers['x-request-id'];
  req.id = typeof providedId === 'string' && /^[a-zA-Z0-9._-]{1,128}$/.test(providedId)
    ? providedId
    : crypto.randomUUID();
  res.setHeader('x-request-id', req.id);
  next();
}
