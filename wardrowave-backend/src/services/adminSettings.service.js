import { DEFAULT_SETTINGS } from '../config/constants.js';
import { ServiceablePincode } from '../models/ServiceablePincode.js';
import { Setting } from '../models/Setting.js';
import { ApiError } from '../utils/ApiError.js';
import { withTransaction } from '../utils/withTransaction.js';
import { writeAuditLog } from './audit.service.js';
import { getRentalSettings, invalidateRentalSettingsCache } from './settings.service.js';

/**
 * Returns effective runtime settings without exposing environment credentials.
 */
export async function readAdminSettings() {
  return getRentalSettings();
}

/**
 * Updates runtime settings, validates cross-field constraints, and invalidates the cache.
 */
export async function updateAdminSettings({ input, actor, request }) {
  const updated = await withTransaction(async (session) => {
    const current = await getRentalSettings({ session });
    const next = { ...current, ...input };
    if (next.minRentalDays > next.maxRentalDays) {
      throw new ApiError(400, 'Minimum rental days cannot exceed maximum rental days');
    }
    if (next.minLeadDays > next.maxAdvanceDays) {
      throw new ApiError(400, 'Minimum lead time cannot exceed maximum advance time');
    }
    const records = [];
    for (const [key, value] of Object.entries(input)) {
      const record = await Setting.findOneAndUpdate(
        { key },
        { $set: { value } },
        { new: true, upsert: true, runValidators: true, session }
      ).exec();
      records.push(record);
    }
    await writeAuditLog({
      actor: actor._id,
      actorRole: actor.role,
      action: 'settings.updated',
      entityType: 'Setting',
      entityId: records[0]._id,
      summary: { fields: Object.keys(input) },
      ip: request.ip,
      userAgent: request.userAgent,
      requestId: request.requestId,
      session,
    });
    return next;
  });
  invalidateRentalSettingsCache();
  return { ...DEFAULT_SETTINGS, ...updated };
}

/**
 * Adds or updates a delivery pincode and records an audit event.
 */
export async function updateServiceablePincode({ pincode, input, actor, request }) {
  return withTransaction(async (session) => {
    const record = await ServiceablePincode.findOneAndUpdate(
      { pincode },
      { $set: input, $setOnInsert: { pincode } },
      { new: true, upsert: true, runValidators: true, session }
    ).exec();
    await writeAuditLog({
      actor: actor._id,
      actorRole: actor.role,
      action: 'pincode.updated',
      entityType: 'ServiceablePincode',
      entityId: record._id,
      summary: { pincode, isActive: record.isActive },
      ip: request.ip,
      userAgent: request.userAgent,
      requestId: request.requestId,
      session,
    });
    return record.toJSON();
  });
}
