import { Booking } from '../models/Booking.js';
import { Payment } from '../models/Payment.js';
import { Refund } from '../models/Refund.js';
import { ApiError } from '../utils/ApiError.js';
import { withTransaction } from '../utils/withTransaction.js';
import { writeAuditLog } from './audit.service.js';
import { createRefundRecord, submitRefund } from './payment.service.js';

export async function initiateAdminRefund({
  paymentId,
  amount,
  notes,
  actor,
  request,
}) {
  const refund = await withTransaction(async (session) => {
    const payment = await Payment.findById(paymentId).session(session).exec();
    if (!payment) throw new ApiError(404, 'Payment not found');
    if (!['captured', 'partially_refunded'].includes(payment.status) || !payment.razorpayPaymentId) {
      throw new ApiError(409, 'Only captured payments with a remaining refundable balance can be refunded');
    }

    const booking = await Booking.findById(payment.booking).session(session).exec();
    if (!booking) throw new ApiError(409, 'The payment booking could not be found');

    const createdRefund = await createRefundRecord({
      booking,
      payment,
      amount,
      reason: 'admin_goodwill',
      initiatedBy: actor._id,
      notes,
      session,
    });
    await writeAuditLog({
      actor: actor._id,
      actorRole: actor.role,
      action: 'payment.admin_refund_initiated',
      entityType: 'Payment',
      entityId: payment._id,
      summary: {
        bookingNumber: booking.bookingNumber,
        refundId: String(createdRefund._id),
        amount,
        reason: 'admin_goodwill',
      },
      ...request,
      session,
    });
    return createdRefund;
  });

  await submitRefund(refund._id);
  const [payment, updatedRefund] = await Promise.all([
    Payment.findById(paymentId)
      .select('booking user razorpayOrderId razorpayPaymentId amount refundedAmount refundReservedAmount currency status paidAt')
      .lean()
      .exec(),
    Refund.findById(refund._id).lean().exec(),
  ]);
  return { payment, refund: updatedRefund };
}
