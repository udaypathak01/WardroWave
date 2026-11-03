import { AuditLog } from '../models/AuditLog.js';

/**
 * Writes an immutable actor/action record for a staff or admin mutation.
 */
export async function writeAuditLog({
  actor,
  actorRole,
  action,
  entityType,
  entityId,
  summary,
  ip,
  userAgent,
  requestId,
  session,
}) {
  const [entry] = await AuditLog.create(
    [{
      actor,
      actorRole,
      action,
      entityType,
      entityId,
      summary,
      ip,
      userAgent,
      requestId,
    }],
    session ? { session } : undefined
  );
  return entry;
}
