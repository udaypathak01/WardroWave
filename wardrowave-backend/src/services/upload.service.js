import { createHmac, randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import { cloudinary } from '../config/cloudinary.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/ApiError.js';

const imagePresets = {
  thumbnail: { width: 300, height: 300, crop: 'fill' },
  card: { width: 600, height: 800, crop: 'fill' },
  detail: { width: 1200, height: 1600, crop: 'limit' },
};
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function assertCloudinaryConfigured() {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw new ApiError(503, 'Image upload service is not configured', 'UPLOAD_SERVICE_UNAVAILABLE');
  }
}

/**
 * Uploads a validated image buffer to a scoped Cloudinary folder.
 */
export async function uploadBuffer(buffer, { folder, publicIdPrefix = 'image' }) {
  assertCloudinaryConfigured();
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new ApiError(400, 'Image content is empty', 'INVALID_UPLOAD_CONTENT');
  }
  const folderPattern = new RegExp(
    `^${escapeRegex(env.CLOUDINARY_FOLDER)}/(products|users|reviews|damage)/[a-zA-Z0-9_-]+$`
  );
  if (typeof folder !== 'string' || !folderPattern.test(folder)) {
    throw new ApiError(400, 'Image upload folder is invalid', 'INVALID_UPLOAD_FOLDER');
  }

  const publicId = `${publicIdPrefix}-${randomUUID()}`;
  try {
    return await new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream({
        folder,
        public_id: publicId,
        resource_type: 'image',
        overwrite: false,
        transformation: [{
          fetch_format: 'auto',
          quality: 'auto',
          width: 2000,
          height: 2000,
          crop: 'limit',
        }],
      }, (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
        });
      });
      Readable.from(buffer).pipe(upload);
    });
  } catch (error) {
    logger.error({
      errorName: error.name,
      providerCode: error.http_code,
      folder,
    }, 'Cloudinary image upload failed');
    throw new ApiError(502, 'Image upload failed', 'IMAGE_UPLOAD_FAILED');
  }
}

/**
 * Builds a secure Cloudinary URL using a named, bounded image transformation.
 */
export function buildUrl(publicId, preset = 'card') {
  assertCloudinaryConfigured();
  const transformation = imagePresets[preset];
  if (!transformation) throw new TypeError(`Unknown image preset: ${preset}`);
  return cloudinary.url(publicId, {
    secure: true,
    resource_type: 'image',
    transformation: [{
      ...transformation,
      fetch_format: 'auto',
      quality: 'auto',
    }],
  });
}

/**
 * Deletes a Cloudinary image without making asset cleanup block its parent operation.
 */
export async function deleteAsset(publicId) {
  if (!publicId) return;
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    logger.warn({ publicId }, 'Cloudinary asset could not be deleted because the service is not configured');
    return;
  }
  try {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: 'image', invalidate: true });
    if (!['ok', 'not found'].includes(result.result)) {
      logger.warn({ publicId, result: result.result }, 'Cloudinary asset deletion was not confirmed');
    }
  } catch (error) {
    logger.warn({
      publicId,
      errorName: error.name,
      providerCode: error.http_code,
    }, 'Cloudinary asset deletion failed');
  }
}

/**
 * Deletes multiple Cloudinary images, continuing after individual best-effort failures.
 */
export async function deleteMany(publicIds) {
  await Promise.all([...new Set(publicIds.filter(Boolean))].map(deleteAsset));
}

/**
 * Creates short-lived Cloudinary direct-upload signature parameters for a scoped folder.
 */
export function createCatalogUploadSignature(productId = undefined) {
  assertCloudinaryConfigured();
  if (productId !== undefined && !/^[a-f\d]{24}$/i.test(productId)) {
    throw new ApiError(400, 'Product ID is invalid', 'INVALID_ID');
  }
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = productId
    ? `${env.CLOUDINARY_FOLDER}/products/${productId}`
    : `${env.CLOUDINARY_FOLDER}/catalog`;
  const signature = createHmac('sha1', env.CLOUDINARY_API_SECRET)
    .update(`folder=${folder}&timestamp=${timestamp}`)
    .digest('hex');
  return {
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    timestamp,
    folder,
    signature,
  };
}
