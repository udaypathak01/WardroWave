import { admin } from '../config/firebase.js';
import { Booking } from '../models/Booking.js';
import { User } from '../models/User.js';
import { AdminAccessLock } from '../models/AdminAccessLock.js';
import { Notification } from '../models/Notification.js';
import { WardrobeImage } from '../models/WardrobeImage.js';
import { ApiError } from '../utils/ApiError.js';
import { withTransaction } from '../utils/withTransaction.js';
import { writeAuditLog } from './audit.service.js';
import { logger } from '../utils/logger.js';
import {
  hasRoleAtLeast,
  isAdminRole,
  isPrivilegedRole,
  isRoleDemotion,
} from '../utils/roleHierarchy.js';
import { deleteAsset, deleteMany, uploadBuffer } from './upload.service.js';
import { env } from '../config/env.js';

/**
 * Returns a customer profile without exposing Firebase credentials or internal auth claims.
 */
export async function getProfile(userId) {
  const user = await User.findOne({ _id: userId, deletedAt: null }).exec();
  if (!user) throw new ApiError(404, 'User not found');
  return user.toJSON();
}

/**
 * Updates allowed profile fields for the authenticated customer.
 */
export async function updateProfile(userId, updates) {
  const user = await User.findOneAndUpdate(
    { _id: userId, deletedAt: null },
    { $set: updates },
    { new: true, runValidators: true }
  ).exec();
  if (!user) throw new ApiError(404, 'User not found');
  return user.toJSON();
}

/**
 * Replaces the authenticated user's avatar and removes the previous Cloudinary asset.
 */
export async function updateAvatar(userId, file) {
  const existingUser = await User.findOne({ _id: userId, deletedAt: null })
    .select('avatar')
    .lean()
    .exec();
  if (!existingUser) throw new ApiError(404, 'User not found');

  const uploaded = await uploadBuffer(file.buffer, {
    folder: `${env.CLOUDINARY_FOLDER}/users/${userId}`,
    publicIdPrefix: 'avatar',
  });
  try {
    const user = await User.findOneAndUpdate(
      { _id: userId, deletedAt: null },
      { $set: { avatar: { url: uploaded.url, publicId: uploaded.publicId } } },
      { new: true, runValidators: true }
    ).exec();
    if (!user) throw new ApiError(404, 'User not found');
  } catch (error) {
    await deleteAsset(uploaded.publicId);
    throw error;
  }
  if (existingUser.avatar?.publicId) await deleteAsset(existingUser.avatar.publicId);
  return {
    avatar: { url: uploaded.url, publicId: uploaded.publicId },
  };
}

/**
 * Adds a validated address and keeps exactly one address marked as default.
 */
export async function addAddress(userId, addressInput) {
  return withTransaction(async (session) => {
    const user = await User.findOne({ _id: userId, deletedAt: null }).session(session).exec();
    if (!user) throw new ApiError(404, 'User not found');
    if (user.addresses.length >= 10) {
      throw new ApiError(409, 'A maximum of 10 addresses is allowed');
    }

    const makeDefault = addressInput.isDefault || user.addresses.length === 0;
    if (makeDefault) {
      user.addresses.forEach((address) => {
        address.isDefault = false;
      });
    }
    user.addresses.push({ ...addressInput, isDefault: makeDefault });
    await user.save({ session });
    return user.addresses[user.addresses.length - 1].toJSON();
  });
}

/**
 * Updates an address only if it belongs to the authenticated customer.
 */
export async function updateAddress(userId, addressId, updates) {
  return withTransaction(async (session) => {
    const user = await User.findOne({ _id: userId, deletedAt: null }).session(session).exec();
    const address = user?.addresses.id(addressId);
    if (!address) throw new ApiError(404, 'Address not found');
    if (updates.isDefault === false && address.isDefault) {
      throw new ApiError(400, 'Choose another default address before unsetting this one');
    }
    if (updates.isDefault === true) {
      user.addresses.forEach((entry) => {
        entry.isDefault = false;
      });
    }
    Object.assign(address, updates);
    await user.save({ session });
    return address.toJSON();
  });
}

/**
 * Deletes an owned address and assigns a replacement default when necessary.
 */
export async function deleteAddress(userId, addressId) {
  return withTransaction(async (session) => {
    const user = await User.findOne({ _id: userId, deletedAt: null }).session(session).exec();
    const address = user?.addresses.id(addressId);
    if (!address) throw new ApiError(404, 'Address not found');
    const wasDefault = address.isDefault;
    user.addresses.pull(addressId);
    if (wasDefault && user.addresses.length > 0) user.addresses[0].isDefault = true;
    await user.save({ session });
    return { deleted: true };
  });
}

/**
 * Blocks active bookings before soft-deleting the customer and Firebase identity.
 */
export async function deleteAccount(userId, { actor, request } = {}) {
  const anonymize = async (session) => {
    let userQuery = User.findOne({ _id: userId, deletedAt: null });
    if (session) userQuery = userQuery.session(session);
    const user = await userQuery.exec();
    if (!user) throw new ApiError(404, 'User not found');
    if (actor && user.role !== 'customer') {
      throw new ApiError(409, 'Administrator and staff accounts must be disabled through access management');
    }

    let activeBookingQuery = Booking.exists({
      user: userId,
      status: {
        $in: [
          'pending_payment',
          'confirmed',
          'partially_dispatched',
          'dispatched',
          'delivered',
          'return_requested',
          'returned',
        ],
      },
    });
    if (session) activeBookingQuery = activeBookingQuery.session(session);
    if (await activeBookingQuery) {
      throw new ApiError(409, 'Account cannot be deleted while active bookings exist');
    }

    const identity = {
      firebaseUid: user.firebaseUid,
      avatarPublicId: user.avatar?.publicId,
    };
    const wardrobeQuery = WardrobeImage.find({ user: userId }).select('publicId');
    if (session) wardrobeQuery.session(session);
    const wardrobeImages = await wardrobeQuery.lean().exec();

    user.status = 'blocked';
    user.deletedAt = new Date();
    user.name = 'Deleted User';
    user.firebaseUid = `deleted:${user._id}`;
    user.avatar = {};
    user.addresses = [];
    user.email = undefined;
    user.phone = undefined;
    user.measurements = undefined;
    await user.save(session ? { session } : undefined);

    let imageDelete = WardrobeImage.deleteMany({ user: userId });
    if (session) imageDelete = imageDelete.session(session);
    await imageDelete.exec();

    if (actor) {
      await writeAuditLog({
        actor: actor._id,
        actorRole: actor.role,
        action: 'user.account_deleted',
        entityType: 'User',
        entityId: user._id,
        summary: { role: user.role, status: 'blocked', anonymized: true },
        ...request,
        session,
      });
    }
    return {
      ...identity,
      wardrobePublicIds: wardrobeImages.map((image) => image.publicId),
    };
  };

  const deletedIdentity = actor
    ? await withTransaction((session) => anonymize(session))
    : await anonymize();
  await deleteMany([
    deletedIdentity.avatarPublicId,
    ...deletedIdentity.wardrobePublicIds,
  ]);

  try {
    await admin.auth().deleteUser(deletedIdentity.firebaseUid);
  } catch (error) {
    if (error.code !== 'auth/user-not-found') {
      logger.error({ err: error, userId }, 'Firebase identity deletion failed');
      throw new ApiError(502, 'Account was anonymized but Firebase identity deletion failed');
    }
  }
  return { deleted: true };
}

/**
 * Changes a customer's role or account state and records the administrative audit trail.
 */
export async function changeUserAccess({
  targetUserId,
  actor,
  role,
  status,
  ip,
  userAgent,
  requestId,
}) {
  try {
    await AdminAccessLock.updateOne(
      { _id: 'user-access' },
      { $setOnInsert: { version: 0 } },
      { upsert: true }
    ).exec();
  } catch (error) {
    if (error.code !== 11000) throw error;
  }
  const result = await withTransaction(async (session) => {
    await AdminAccessLock.updateOne(
      { _id: 'user-access' },
      { $inc: { version: 1 } },
      { session }
    ).exec();
    const target = await User.findOne({ _id: targetUserId, deletedAt: null }).session(session).exec();
    if (!target) throw new ApiError(404, 'User not found');
    const before = { role: target.role, status: target.status };
    if (role && isAdminRole(role) && role !== target.role && (!target.email || !target.emailVerified)) {
      throw new ApiError(409, 'Only users with a verified email can become administrators');
    }
    if (
      role
      && role !== target.role
      && (isAdminRole(role) || isAdminRole(target.role))
      && actor.role !== 'superadmin'
    ) {
      throw new ApiError(403, 'Only a superadministrator can change administrator roles');
    }
    if (
      status
      && status !== target.status
      && isPrivilegedRole(target.role)
      && actor.role !== 'superadmin'
    ) {
      throw new ApiError(403, 'Only a superadministrator can change administrator status');
    }
    if (role) target.role = role;
    if (status) target.status = status;
    if (
      String(actor._id) === String(target._id) &&
      (
        target.role !== before.role
        && !(
          isAdminRole(target.role)
          && isAdminRole(before.role)
          && hasRoleAtLeast(target.role, before.role)
        )
        || target.status !== 'active'
      )
    ) {
      throw new ApiError(409, 'You cannot remove your own active administrator access');
    }
    if (
      isAdminRole(before.role) &&
      before.status === 'active' &&
      (!isAdminRole(target.role) || target.status !== 'active')
    ) {
      const activeAdmins = await User.countDocuments({
        _id: { $ne: target._id },
        role: { $in: ['admin', 'superadmin'] },
        status: 'active',
        deletedAt: null,
      }).session(session).exec();
      if (activeAdmins === 0) {
        throw new ApiError(409, 'The last active administrator cannot be demoted or blocked');
      }
    }
    await target.save({ session });
    await writeAuditLog({
      actor: actor._id,
      actorRole: actor.role,
      action: 'user.access_updated',
      entityType: 'User',
      entityId: target._id,
      summary: { before, after: { role: target.role, status: target.status } },
      ip,
      userAgent,
      requestId,
      session,
    });
    return { target, previousRole: before.role };
  });

  try {
    await admin.auth().setCustomUserClaims(result.target.firebaseUid, { role: result.target.role });
    if (
      result.target.status === 'blocked' ||
      isRoleDemotion(result.previousRole, result.target.role)
    ) {
      await admin.auth().revokeRefreshTokens(result.target.firebaseUid);
    }
  } catch (error) {
    logger.error({ err: error, targetUserId }, 'Firebase role synchronization failed');
    throw new ApiError(502, 'User access was saved but Firebase claims could not be synchronized');
  }
  return result.target.toJSON();
}

/**
 * Lists an authenticated customer's notifications using a descending keyset cursor.
 */
export async function listNotifications(userId, { limit, cursor }) {
  let cursorRecord;
  if (cursor) {
    cursorRecord = await Notification.findOne({ _id: cursor, user: userId })
      .select('createdAt')
      .lean()
      .exec();
    if (!cursorRecord) throw new ApiError(400, 'Notification cursor is invalid');
  }
  const query = { user: userId };
  if (cursorRecord) {
    query.$or = [
      { createdAt: { $lt: cursorRecord.createdAt } },
      { createdAt: cursorRecord.createdAt, _id: { $lt: cursor } },
    ];
  }
  const documents = await Notification.find(query)
    .select('type title body data readAt createdAt')
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit + 1)
    .lean()
    .exec();
  const hasMore = documents.length > limit;
  if (hasMore) documents.pop();
  return {
    items: documents.map(({ _id, ...notification }) => ({ id: String(_id), ...notification })),
    nextCursor: hasMore ? String(documents.at(-1)._id) : null,
  };
}

/**
 * Marks one owned notification as read, idempotently.
 */
export async function markNotificationRead(userId, notificationId) {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { $set: { readAt: new Date() } },
    { new: true }
  )
    .select('type title body data readAt createdAt')
    .lean()
    .exec();
  if (!notification) throw new ApiError(404, 'Notification not found');
  const { _id, ...details } = notification;
  return { id: String(_id), ...details };
}
