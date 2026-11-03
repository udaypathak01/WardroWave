import { Booking } from '../models/Booking.js';
import { ApiError } from '../utils/ApiError.js';
import { writeAuditLog } from './audit.service.js';
import { recordUserNotification } from './notification.service.js';
import { formatINR } from '../utils/money.js';
import { formatRentalDate } from '../utils/dates.js';

function formatEmailDate(date) {
  return date ? formatRentalDate(date) : 'not specified';
}

/**
 * Loads a booking inside an active transaction.
 */
export async function loadBooking(bookingId, session) {
  const booking = await Booking.findById(bookingId).session(session).exec();
  if (!booking) throw new ApiError(404, 'Booking not found');
  return booking;
}

/**
 * Writes an audit entry for a staff booking transition.
 */
export async function auditMutation({ actor, booking, action, summary, request, session }) {
  await writeAuditLog({
    actor: actor._id,
    actorRole: actor.role,
    action,
    entityType: 'Booking',
    entityId: booking._id,
    summary,
    ip: request.ip,
    userAgent: request.userAgent,
    requestId: request.requestId,
    session,
  });
}

/**
 * Persists an in-app and email notification for a booking transition.
 */
export async function notifyBooking(booking, {
  type,
  title,
  body,
  event,
  emailTemplate,
  emailContext = {},
  session,
}) {
  const templateByEvent = {
    cancelled: 'booking-cancelled',
    expired: 'booking-expired',
    dispatched: 'order-dispatched',
    delivered: 'order-delivered',
    returned: 'return-received',
    inspected: 'settlement',
  };
  const startDate = booking.items.reduce(
    (earliest, item) => !earliest || item.startDate < earliest ? item.startDate : earliest,
    null
  );
  const endDate = booking.items.reduce(
    (latest, item) => !latest || item.endDate > latest ? item.endDate : latest,
    null
  );
  await recordUserNotification({
    userId: booking.user,
    type,
    title,
    body,
    data: { bookingId: booking._id, bookingNumber: booking.bookingNumber },
    eventKey: `booking:${booking._id}:${event}`,
    emailTemplate: emailTemplate ?? templateByEvent[event] ?? 'generic',
    emailContext: {
      bookingNumber: booking.bookingNumber,
      startDate: formatEmailDate(startDate),
      endDate: formatEmailDate(endDate),
      returnDate: formatEmailDate(endDate),
      carrier: booking.logistics?.outboundCarrier ?? '',
      trackingNumber: booking.logistics?.outboundTracking ?? '',
      refundAmount: formatINR(booking.cancellation?.refundAmount ?? 0),
      retainedAmount: formatINR(booking.cancellation?.retainedAmount ?? 0),
      lateFee: formatINR(booking.settlement?.lateFee ?? 0),
      damageCharge: formatINR(booking.settlement?.damageCharge ?? 0),
      depositRefunded: formatINR(booking.settlement?.depositRefunded ?? 0),
      depositDeducted: formatINR(booking.settlement?.depositDeducted ?? 0),
      outstandingAmount: formatINR(booking.settlement?.outstandingAmount ?? 0),
      ...emailContext,
    },
    session,
  });
}
