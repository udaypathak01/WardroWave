import admin from '../config/firebase.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/User.js';

if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Verifies a Firebase bearer token and stores its decoded claims on the request.
 */
export async function verifyFirebaseToken(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new ApiError(401, 'Authentication required');
    }

    const token = header.slice('Bearer '.length).trim();
    req.firebaseUser = await admin.auth().verifyIdToken(token, true);
    next();
  } catch (error) {
    next(error instanceof ApiError ? error : new ApiError(401, 'Invalid authentication token'));
  }
}

/**
 * Verifies a Firebase token and attaches the corresponding active Mongo user.
 */
export async function authenticate(req, res, next) {
  await verifyFirebaseToken(req, res, async (error) => {
    if (error) {
      next(error);
      return;
    }

    try {
      const user = await User.findOne({
        firebaseUid: req.firebaseUser.uid,
        deletedAt: null,
      }).exec();
      if (!user) {
        throw new ApiError(401, 'User account has not been synchronized', undefined, 'USER_NOT_SYNCED');
      }
      if (user.status === 'blocked') {
        throw new ApiError(403, 'Account is blocked', undefined, 'ACCOUNT_BLOCKED');
      }

      req.user = user;
      next();
    } catch (lookupError) {
      next(lookupError);
    }
  });
}

/**
 * Attaches an active local user when a valid optional bearer token is supplied.
 */
export async function optionalAuthenticate(req, res, next) {
  if (!req.headers.authorization) {
    next();
    return;
  }

  await verifyFirebaseToken(req, res, async (error) => {
    if (error) {
      next(error);
      return;
    }
    try {
      const user = await User.findOne({
        firebaseUid: req.firebaseUser.uid,
        status: 'active',
        deletedAt: null,
      }).exec();
      if (user) req.user = user;
      next();
    } catch (lookupError) {
      next(lookupError);
    }
  });
}
