import { ZodError } from 'zod';
import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/ApiError.js';
import { captureException } from '../utils/observability.js';

function validationIssues(error) {
  if (error instanceof ZodError) {
    return error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));
  }
  if (error.name === 'ValidationError') {
    return Object.values(error.errors).map(({ path, message }) => ({ path, message }));
  }
  return undefined;
}

function duplicateKeyIssue(error) {
  const field = Object.keys(error.keyPattern ?? error.keyValue ?? {})[0];
  if (!field) return undefined;
  return [{
    path: field,
    message: `${field} must be unique`,
  }];
}

function errorCode(error, statusCode, flags) {
  if (flags.razorpayFailure) return 'PAYMENT_PROVIDER_ERROR';
  if (flags.firebaseAuthFailure) return 'UNAUTHENTICATED';
  if (flags.duplicateKey) return 'DUPLICATE_RESOURCE';
  if (flags.validationFailure) return 'VALIDATION_ERROR';
  if (flags.castFailure) return 'INVALID_ID';
  if (flags.bodyParseFailure) return 'INVALID_JSON';
  if (flags.bodyTooLarge) return 'PAYLOAD_TOO_LARGE';
  if (flags.multerFailure) return error.code ?? 'INVALID_UPLOAD';
  if (error instanceof ApiError && error.code) return error.code;
  if (statusCode === 401) return 'UNAUTHENTICATED';
  if (statusCode === 403) return 'FORBIDDEN';
  if (statusCode === 404) return 'NOT_FOUND';
  if (statusCode === 429) return 'RATE_LIMITED';
  if (statusCode >= 500) return 'INTERNAL_ERROR';
  return 'INVALID_REQUEST';
}

function errorMessage(error, statusCode, flags) {
  if (flags.razorpayFailure) return 'Payment provider request failed';
  if (flags.firebaseAuthFailure) return 'Invalid authentication token';
  if (flags.duplicateKey) return 'A record with that unique value already exists';
  if (flags.validationFailure) return 'Validation failed';
  if (flags.bodyParseFailure) return 'Request body must contain valid JSON';
  if (flags.bodyTooLarge) return 'Request body is too large';
  if (flags.multerFailure) {
    return error.code === 'LIMIT_FILE_SIZE' ? 'Uploaded file exceeds the allowed size' : 'Uploaded file is invalid';
  }
  if (statusCode === 503 && error instanceof ApiError) return error.message;
  if (statusCode >= 500) return 'Something went wrong';
  return error.message || 'Request failed';
}

/**
 * Converts application, validation, database, upload and provider failures into a safe API envelope.
 */
export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  const validationFailure = error instanceof ZodError || error.name === 'ValidationError';
  const duplicateKey = error.code === 11000;
  const castFailure = error.name === 'CastError';
  const bodyParseFailure = error.type === 'entity.parse.failed';
  const bodyTooLarge = error.type === 'entity.too.large';
  const multerFailure = error.name === 'MulterError';
  const firebaseAuthFailure = typeof error.code === 'string' && error.code.startsWith('auth/');
  const razorpayFailure = error.name === 'RazorpayError' || error.constructor?.name === 'RazorpayError';
  const flags = {
    validationFailure,
    duplicateKey,
    castFailure,
    bodyParseFailure,
    bodyTooLarge,
    multerFailure,
    firebaseAuthFailure,
    razorpayFailure,
  };
  const declaredStatus = error.statusCode ?? error.status;
  const statusCode = razorpayFailure
    ? 502
    : validationFailure
      ? 400
      : duplicateKey
        ? 409
        : castFailure || bodyParseFailure || multerFailure
          ? 400
          : bodyTooLarge
            ? 413
            : firebaseAuthFailure
              ? 401
              : Number.isInteger(declaredStatus) && declaredStatus >= 400 && declaredStatus <= 599
                ? declaredStatus
                : 500;
  const errors = validationIssues(error) ??
    (duplicateKey ? duplicateKeyIssue(error) : undefined) ??
    (castFailure ? [{ path: error.path, message: 'Invalid value' }] : undefined) ??
    (error instanceof ApiError ? error.details : undefined);

  logger.error({
    errorName: error.name,
    errorCode: error.code,
    reqId: req.id,
    statusCode,
  }, 'HTTP request failed');
  if (statusCode >= 500) captureException(error, { reqId: req.id, statusCode });

  const apiError = {
    code: errorCode(error, statusCode, flags),
    message: errorMessage(error, statusCode, flags),
  };
  if (errors !== undefined) apiError.details = errors;

  res.status(statusCode).json({
    success: false,
    error: apiError,
  });
}
