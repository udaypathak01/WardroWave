import { Notification } from '../models/Notification.js';
import { Reservation } from '../models/Reservation.js';

const RESERVATION_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
const NOTIFICATION_RETENTION_MS = 180 * 24 * 60 * 60 * 1000;

/**
 * Removes expired reservation history and read notifications beyond their retention.
 */
export async function cleanupOldData(now = new Date()) {
  const reservationCutoff = new Date(now.getTime() - RESERVATION_RETENTION_MS);
  const notificationCutoff = new Date(now.getTime() - NOTIFICATION_RETENTION_MS);
  const [reservations, notifications] = await Promise.all([
    Reservation.deleteMany({ status: 'expired', updatedAt: { $lt: reservationCutoff } }).exec(),
    Notification.deleteMany({ readAt: { $lt: notificationCutoff } }).exec(),
  ]);
  return {
    reservationsDeleted: reservations.deletedCount,
    notificationsDeleted: notifications.deletedCount,
  };
}
