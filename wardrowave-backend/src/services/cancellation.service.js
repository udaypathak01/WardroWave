import { Booking } from '../models/Booking.js';
import { Coupon } from '../models/Coupon.js';
import { CouponRedemption } from '../models/CouponRedemption.js';
import { InventoryUnit } from '../models/InventoryUnit.js';
import { Product } from '../models/Product.js';
import { Payment } from '../models/Payment.js';
import { Reservation } from '../models/Reservation.js';
import { ApiError } from '../utils/ApiError.js';
import { calculateCancellationRefund } from '../utils/bookingPricing.js';
import { withTransaction } from '../utils/withTransaction.js';
import { getRentalSettings } from './settings.service.js';
import { createRefundRecord, submitRefund } from './payment.service.js';
import { notifyBooking } from './fulfillment.helpers.js';
import { countByReference } from '../utils/countByReference.js';

/**
 * Cancels an eligible customer booking and starts a policy-compliant refund.
 */
export async function cancelBooking({ bookingId, userId, reason, now = new Date() }) {
  const result = await withTransaction(async (session) => {
    const booking = await Booking.findOne({ _id: bookingId, user: userId }).session(session).exec();
    if (!booking) throw new ApiError(404, 'Booking not found');
    if (booking.status === 'cancelled') {
      return { booking, refundId: null, idempotent: true };
    }
    if (!['pending_payment', 'confirmed'].includes(booking.status)) {
      throw new ApiError(409, 'This booking can no longer be cancelled', undefined, 'CANCELLATION_NOT_ALLOWED');
    }

    const settings = await getRentalSettings({ session });
    const refund = calculateCancellationRefund(
      { ...booking.toObject(), freeCancelHours: settings.freeCancelHours },
      now
    );
    const wasPaid = booking.payment.status === 'captured';
    const refundAmount = wasPaid ? refund.totalRefund : 0;
    booking.status = 'cancelled';
    booking.items.forEach((item) => {
      item.status = 'cancelled';
    });
    booking.cancellation = {
      cancelledBy: userId,
      reason,
      refundAmount,
      retainedAmount: refund.retained,
      cancelledAt: now,
    };
    booking.timeline.push({ status: 'cancelled', note: reason || 'Cancelled by customer', actor: userId, at: now });
    await booking.save({ session });

    await Reservation.updateMany(
      { booking: booking._id, status: { $in: ['held', 'confirmed'] } },
      { $set: { status: 'cancelled' } },
      { session }
    ).exec();
    const unitIds = booking.items.map((item) => item.unit).filter(Boolean);
    const conflictingUnits = await Reservation.distinct('unit', {
      unit: { $in: unitIds },
      $or: [
        { status: { $in: ['confirmed', 'active'] } },
        { status: 'held', holdExpiresAt: { $gt: now } },
      ],
    }).session(session);
    if (wasPaid) {
      for (const [productId, count] of countByReference(booking.items, 'product')) {
        const updated = await Product.updateOne(
          { _id: productId, rentCount: { $gte: count } },
          { $inc: { rentCount: -count } },
          { session }
        ).exec();
        if (updated.modifiedCount !== 1) {
          throw new ApiError(409, 'Product rental count could not be reversed');
        }
      }
      const conflictingUnitIds = new Set(conflictingUnits.map(String));
      for (const [unitId, count] of countByReference(booking.items, 'unit')) {
        const unit = await InventoryUnit.findById(unitId).session(session).exec();
        if (!unit || unit.rentCount < count) {
          throw new ApiError(409, 'Inventory rental count could not be reversed');
        }
        unit.rentCount -= count;
        if (unit.status === 'reserved' || unit.status === 'retired') {
          unit.status = unit.rentCount >= unit.maxRentCount
            ? 'retired'
            : conflictingUnitIds.has(unitId) ? 'reserved' : 'available';
        }
        await unit.save({ session });
      }
    }

    let refundId = null;
    if (booking.pricing.couponCode) {
      const redemption = await CouponRedemption.findOne({
        booking: booking._id,
        reversedAt: null,
      }).session(session).exec();
      if (redemption) {
        redemption.reversedAt = now;
        await redemption.save({ session });
        await Coupon.updateOne(
          { _id: redemption.coupon, usedCount: { $gt: 0 } },
          { $inc: { usedCount: -1 } },
          { session }
        ).exec();
      } else {
        await Coupon.updateOne(
          { code: booking.pricing.couponCode, reservedCount: { $gt: 0 } },
          { $inc: { reservedCount: -1 } },
          { session }
        ).exec();
      }
    }

    if (refundAmount > 0) {
      const payment = await Payment.findOne({ booking: booking._id, status: 'captured' }).session(session).exec();
      if (!payment) throw new ApiError(409, 'Captured payment record was not found');
      const refundRecord = await createRefundRecord({
        booking,
        payment,
        amount: refundAmount,
        reason: 'cancellation',
        initiatedBy: userId,
        notes: `Booking cancellation: ${reason || 'customer request'}`,
        session,
      });
      refundId = refundRecord._id;
    }
    await notifyBooking(booking, {
      type: 'booking_cancelled',
      title: 'Booking cancelled',
      body: `Booking ${booking.bookingNumber} has been cancelled.`,
      event: 'cancelled',
      session,
    });
    return { booking, refundId, idempotent: false };
  });

  if (result.refundId) {
    await submitRefund(result.refundId);
  }
  return {
    booking: result.booking.toJSON(),
    refundId: result.refundId,
    idempotent: result.idempotent,
  };
}
