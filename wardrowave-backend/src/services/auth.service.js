import admin from '../config/firebase.js';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { recordUserNotification } from './notification.service.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';
import { isAdminRole, isRoleDemotion } from '../utils/roleHierarchy.js';

/**
 * Creates or updates a local user using claims from a verified Firebase token.
 */
export async function upsertUserFromFirebase({ uid, email, emailVerified, name, picture, phone }) {
  const existingUser = await User.findOne({ firebaseUid: uid })
    .select('_id role status deletedAt')
    .lean()
    .exec();
  if (existingUser?.deletedAt) {
    throw new ApiError(410, 'This account has been deleted', 'ACCOUNT_DELETED');
  }
  if (existingUser?.status === 'blocked') {
    throw new ApiError(403, 'Account is blocked', 'ACCOUNT_BLOCKED');
  }

  const normalizedEmail = email?.toLowerCase();
  const adminEmails = env.ADMIN_EMAILS.split(',').map((entry) => entry.trim().toLowerCase()).filter(Boolean);
  const superadminEmails = env.SUPERADMIN_EMAILS.split(',').map((entry) => entry.trim().toLowerCase()).filter(Boolean);
  const authorizedSuperadmin = emailVerified
    && normalizedEmail
    && superadminEmails.includes(normalizedEmail);
  const authorizedAdmin = emailVerified
    && normalizedEmail
    && adminEmails.includes(normalizedEmail);
  const role = authorizedSuperadmin
    ? 'superadmin'
    : authorizedAdmin
      ? 'admin'
    : existingUser?.role === 'staff'
      ? 'staff'
      : 'customer';
  const fieldsToUpdate = {
    ...(email ? { email: normalizedEmail } : {}),
    emailVerified: Boolean(emailVerified),
    name: name || 'WardroWave User',
    ...(picture ? { avatar: { url: picture } } : {}),
    ...(phone ? { phone } : {}),
    lastLoginAt: new Date(),
    ...(existingUser && existingUser.role !== role ? { role } : {}),
  };
  const update = existingUser
    ? { $set: fieldsToUpdate }
    : { $set: fieldsToUpdate, $setOnInsert: { firebaseUid: uid, role } };
  let user = await User.findOneAndUpdate(
    { firebaseUid: uid },
    update,
    { upsert: true, new: true }
  );
  try {
    if (isAdminRole(user.role)) {
      await admin.auth().setCustomUserClaims(uid, { role: user.role });
    } else if (existingUser && isAdminRole(existingUser.role)) {
      await admin.auth().setCustomUserClaims(uid, {});
    }
    if (existingUser && isRoleDemotion(existingUser.role, user.role)) {
      await admin.auth().revokeRefreshTokens(uid);
    }
  } catch (error) {
    logger.error({ err: error, userId: user._id }, 'Firebase role synchronization failed');
    throw new ApiError(502, 'User role was saved but Firebase claims could not be synchronized');
  }
  if (!existingUser) {
    await recordUserNotification({
      userId: user._id,
      type: 'welcome',
      title: 'Welcome to WardroWave',
      body: 'Your account is ready for your next rental.',
      eventKey: `user:${user._id}:welcome`,
      emailTemplate: 'welcome',
    });
  }
  return user;
}
