import { getRazorpay } from '../config/razorpay.js';
import { Booking } from '../models/Booking.js';
import { confirmPayment } from '../services/payment.service.js';
import { logger } from '../utils/logger.js';

/**
 * Confirms captured Razorpay payments whose webhooks were delayed or lost.
 */
export async function reconcilePendingPayments(now = new Date()) {
  const cutoff = new Date(now.getTime() - 5 * 60_000);
  const bookings = await Booking.find({
    status: 'pending_payment',
    createdAt: { $lte: cutoff },
    'payment.razorpayOrderId': { $exists: true, $ne: null },
  })
    .sort({ createdAt: 1 })
    .limit(100)
    .lean()
    .exec();

  let confirmedCount = 0;
  for (const booking of bookings) {
    try {
      const payments = await getRazorpay().orders.fetchPayments(booking.payment.razorpayOrderId);
      const captured = payments.items?.find((payment) => payment.status === 'captured');
      if (!captured) continue;
      const result = await confirmPayment({
        orderId: booking.payment.razorpayOrderId,
        paymentId: captured.id,
        source: 'reconciliation',
        payment: captured,
      });
      if (result.confirmed) confirmedCount += 1;
    } catch (error) {
      logger.error(
        { err: error, bookingId: booking._id, bookingNumber: booking.bookingNumber },
        'Payment reconciliation failed for booking'
      );
    }
  }
  return confirmedCount;
}
