import { Booking } from '../models/Booking.js';
import { Coupon } from '../models/Coupon.js';
import { Reservation } from '../models/Reservation.js';
import { withTransaction } from '../utils/withTransaction.js';
import { notifyBooking } from '../services/fulfillment.helpers.js';

/**
 * Expires timed-out checkout holds and releases their coupon usage reservations.
 */
export async function releaseExpiredHolds(now = new Date()) {
  const expired = await Reservation.distinct('booking', {
    status: 'held',
    holdExpiresAt: { $lte: now },
    booking: { $ne: null },
  }).exec();
  let releasedCount = 0;

  for (const bookingId of expired) {
    const released = await withTransaction(async (session) => {
      const booking = await Booking.findOne({
        _id: bookingId,
        status: 'pending_payment',
        holdExpiresAt: { $lte: now },
      }).session(session).exec();
      if (!booking) return false;

      const reservations = await Reservation.updateMany(
        { booking: booking._id, status: 'held', holdExpiresAt: { $lte: now } },
        { $set: { status: 'expired' } },
        { session }
      ).exec();
      if (reservations.modifiedCount === 0) return false;

      booking.status = 'expired';
      booking.items.forEach((item) => {
        item.status = 'cancelled';
      });
      booking.holdExpiresAt = undefined;
      booking.timeline.push({
        status: 'expired',
        note: 'Checkout hold expired before payment was completed',
        at: now,
      });
      await booking.save({ session });

      if (booking.pricing.couponCode) {
        await Coupon.updateOne(
          { code: booking.pricing.couponCode, reservedCount: { $gt: 0 } },
          { $inc: { reservedCount: -1 } },
          { session }
        ).exec();
      }
      await notifyBooking(booking, {
        type: 'booking_expired',
        title: 'Checkout hold expired',
        body: `The payment hold for booking ${booking.bookingNumber} expired before payment was completed.`,
        event: 'expired',
        session,
      });
      return true;
    });
    if (released) releasedCount += 1;
  }
  return releasedCount;
}
