import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

const signatureChecks = {
  'image/jpeg': (buffer) =>
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff,
  'image/png': (buffer) =>
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  'image/webp': (buffer) =>
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP',
};

const parser = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 8,
    fields: 30,
    parts: 40,
  },
  fileFilter(req, file, callback) {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(new ApiError(400, 'Only JPEG, PNG, and WebP images are allowed', 'INVALID_UPLOAD_TYPE'));
      return;
    }
    callback(null, true);
  },
});

function validateImageBytes(files, next) {
  for (const file of files) {
    const matchesMime = signatureChecks[file.mimetype]?.(file.buffer);
    if (!matchesMime) {
      next(new ApiError(400, 'Image content does not match its declared type', 'INVALID_UPLOAD_CONTENT'));
      return;
    }
  }
  next();
}

/**
 * Parses one bounded image upload and validates its file signature before controller execution.
 */
export function uploadSingle(fieldName) {
  return (req, res, next) => {
    parser.single(fieldName)(req, res, (error) => {
      if (error) return next(error);
      if (!req.file) {
        next(new ApiError(400, 'An image file is required', 'UPLOAD_FILE_REQUIRED'));
        return;
      }
      validateImageBytes([req.file], next);
    });
  };
}

/**
 * Parses a bounded set of image uploads and validates every file signature.
 */
export function uploadMany(fieldName, maxFiles = 8) {
  if (!Number.isInteger(maxFiles) || maxFiles < 1 || maxFiles > 8) {
    throw new TypeError('maxFiles must be a whole number from 1 to 8');
  }
  return (req, res, next) => {
    parser.array(fieldName, maxFiles)(req, res, (error) => {
      if (error) return next(error);
      validateImageBytes(req.files ?? [], next);
    });
  };
}
