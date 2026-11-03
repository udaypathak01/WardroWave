import { readFileSync } from 'node:fs';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const packageJson = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf8')
);

function integrationConfiguration() {
  return {
    firebase: Boolean(
      env.FIREBASE_PROJECT_ID &&
      env.FIREBASE_CLIENT_EMAIL &&
      env.FIREBASE_PRIVATE_KEY
    ),
    cloudinary: Boolean(
      env.CLOUDINARY_CLOUD_NAME &&
      env.CLOUDINARY_API_KEY &&
      env.CLOUDINARY_API_SECRET
    ),
  };
}

/**
 * Reports process liveness and basic runtime metrics.
 */
export function getLiveness(req, res) {
  ApiResponse.success(res, {
    status: 'ok',
    uptimeSeconds: Math.floor(process.uptime()),
    version: packageJson.version,
    memory: process.memoryUsage(),
    databaseState: mongoose.connection.readyState,
  });
}

/**
 * Pings MongoDB and reports non-secret external-service configuration presence.
 */
export const getReadiness = asyncHandler(async (req, res) => {
  let databaseReady = false;
  if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
    try {
      await mongoose.connection.db.admin().ping();
      databaseReady = true;
    } catch {
      databaseReady = false;
    }
  }
  const ready = databaseReady;
  if (!ready) {
    throw new ApiError(503, 'Service is not ready', 'NOT_READY', {
      database: 'unavailable',
    });
  }
  ApiResponse.success(res, {
    status: 'ready',
    checks: {
      database: 'ok',
      integrations: integrationConfiguration(),
    },
  });
});
