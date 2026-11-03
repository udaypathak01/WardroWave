import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError.js';

function stripUnsafeKeys(value) {
  if (Array.isArray(value)) return value.map(stripUnsafeKeys);
  if (!value || typeof value !== 'object' || Object.getPrototypeOf(value) !== Object.prototype) {
    return value;
  }

  const sanitized = {};
  for (const [key, nestedValue] of Object.entries(value)) {
    if (key.startsWith('$') || key.includes('.') || ['__proto__', 'constructor', 'prototype'].includes(key)) {
      continue;
    }
    Object.defineProperty(sanitized, key, {
      configurable: true,
      enumerable: true,
      writable: true,
      value: stripUnsafeKeys(nestedValue),
    });
  }
  return sanitized;
}

/**
 * Parses and replaces a request section with its Zod-validated representation.
 */
export function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      Object.defineProperty(req, source, {
        configurable: true,
        enumerable: true,
        writable: true,
        value: schema.parse(stripUnsafeKeys(req[source])),
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        }));
        next(new ApiError(400, 'Validation failed', 'VALIDATION_ERROR', details));
        return;
      }
      next(error);
    }
  };
}
