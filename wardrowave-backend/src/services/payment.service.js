import { getRazorpay } from '../config/razorpay.js';
import { env } from '../config/env.js';
import { Booking } from '../models/Booking.js';
import { Cart } from '../models/Cart.js';
import { Coupon } from '../models/Coupon.js';
import { CouponRedemption } from '../models/CouponRedemption.js';
import { InventoryUnit } from '../models/InventoryUnit.js';
import { Payment } from '../models/Payment.js';
import { Product } from '../models/Product.js';
import { Refund } from '../models/Refund.js';
import { Reservation } from '../models/Reservation.js';
import { User } from '../models/User.js';
import { WebhookEvent } from '../models/WebhookEvent.js';
import { ApiError } from '../utils/ApiError.js';
import { hmacSha256, timingSafeCompareHex } from '../utils/crypto.js';
import { logger } from '../utils/logger.js';
import { withTransaction } from '../utils/withTransaction.js';
import { notifyAdmins, recordUserNotification } from './notification.service.js';
import { countByReference } from '../utils/countByReference.js';
import { formatINR } from '../utils/money.js';
import { formatRentalDate } from '../utils/dates.js';

const paymentLogger = logger.child({ module: 'payment' });

/**
 * Verifies a Razorpay payment signature and authoritative captured amount before confirmation.
 */
export async function verifyPayment({ userId, orderId, paymentId, signature }) {
  if (!env.RAZORPAY_KEY_SECRET) throw new ApiError(503, 'Payment provider is not configured');
  const expected = hmacSha256(`${orderId}|${paymentId}`, env.RAZORPAY_KEY_SECRET);
  if (!timingSafeCompareHex(expected, signature)) {
    throw new ApiError(400, 'Payment signature is invalid', undefined, 'INVALID_PAYMENT_SIGNATURE');
  }

  const localPayment = await Payment.findOne({ razorpayOrderId: orderId, user: userId }).lean().exec();
  if (!localPayment) throw new ApiError(404, 'Payment order not found');
  const activeBooking = await Booking.findOne({
    _id: localPayment.booking,
    user: userId,
    'payment.razorpayOrderId': orderId,
    status: { $in: ['pending_payment', 'confirmed'] },
  }).lean().exec();
  if (!activeBooking) throw new ApiError(404, 'Payment order not found');
  const remotePayment = await getRazorpay().payments.fetch(paymentId);
  if (
    remotePayment.order_id !== orderId ||
    Number(remotePayment.amount) !== localPayment.amount ||
    !['captured', 'authorized'].includes(remotePayment.status)
  ) {
    throw new ApiError(400, 'Payment details do not match the order', undefined, 'PAYMENT_MISMATCH');
  }

  let authoritativePayment = remotePayment;
  if (remotePayment.status === 'authorized') {
    authoritativePayment = await getRazorpay().payments.capture(
      paymentId,
      localPayment.amount,
      'INR'
    );
    if (authoritativePayment.status !== 'captured') {
      throw new ApiError(409, 'Payment has not been captured', undefined, 'PAYMENT_NOT_CAPTURED');
    }
  }

  return confirmPayment({
    orderId,
    paymentId,
    source: 'client',
    payment: authoritativePayment,
    signature,
  });
}

/**
 * Idempotently confirms a captured payment and its held booking in one transaction.
 */
export async function confirmPayment({ orderId, paymentId, source, payment, signature }) {
  const outcome = await withTransaction(async (session) => {
    const storedPayment = await Payment.findOne({ razorpayOrderId: orderId }).session(session).exec();
    if (!storedPayment) throw new ApiError(404, 'Payment order not found');
    const booking = await Booking.findById(storedPayment.booking).session(session).exec();
    if (!booking) throw new ApiError(404, 'Booking not found');

    if (storedPayment.status === 'captured' && booking.status === 'confirmed') {
      return { booking, duplicate: true, needsRefund: false };
    }

    const staleOrder = booking.payment.razorpayOrderId !== orderId;
    if (staleOrder && !['cancelled', 'expired'].includes(booking.status)) {
      const existingRefund = await Refund.exists({
        booking: booking._id,
        payment: storedPayment._id,
        status: { $in: ['pending', 'processed'] },
      }).session(session);
      if (storedPayment.status !== 'captured') {
        storedPayment.status = 'captured';
        storedPayment.razorpayPaymentId = paymentId;
        storedPayment.razorpaySignature = signature;
        storedPayment.paidAt = new Date();
        await storedPayment.save({ session });
      }
      return {
        booking,
        duplicate: false,
        needsRefund: !existingRefund,
        staleOrder: true,
        storedPayment,
      };
    }

    const holdExpired = booking.holdExpiresAt && booking.holdExpiresAt <= new Date();
    if (['cancelled', 'expired'].includes(booking.status) || holdExpired) {
      const existingRefund = await Refund.exists({
        booking: booking._id,
        reason: 'failed_delivery',
        status: { $in: ['pending', 'processed'] },
      }).session(session);
      booking.status = 'expired';
      booking.timeline.push({
        status: 'expired',
        note: `Captured payment received after booking hold expired (${source})`,
      });
      await booking.save({ session });
      storedPayment.status = 'captured';
      storedPayment.razorpayPaymentId = paymentId;
      storedPayment.razorpaySignature = signature;
      storedPayment.paidAt = new Date();
      await storedPayment.save({ session });
      await Reservation.updateMany(
        { booking: booking._id, status: 'held' },
        { $set: { status: 'cancelled' } },
        { session }
      ).exec();
      return {
        booking,
        duplicate: false,
        needsRefund: !existingRefund,
        expired: true,
        storedPayment,
      };
    }

    storedPayment.status = 'captured';
    storedPayment.razorpayPaymentId = paymentId;
    storedPayment.razorpaySignature = signature;
    storedPayment.method = payment?.method;
    storedPayment.bank = payment?.bank;
    storedPayment.vpa = payment?.vpa;
    storedPayment.cardLast4 = payment?.card?.last4;
    storedPayment.cardNetwork = payment?.card?.network;
    storedPayment.paidAt = new Date();
    await storedPayment.save({ session });

    booking.status = 'confirmed';
    booking.invoiceNumber ||= booking.bookingNumber;
    booking.payment.razorpayPaymentId = paymentId;
    booking.payment.method = payment?.method;
    booking.payment.status = 'captured';
    booking.payment.paidAt = new Date();
    booking.holdExpiresAt = undefined;
    booking.timeline.push({ status: 'confirmed', note: `Payment captured via ${source}` });
    await booking.save({ session });

    await Reservation.updateMany(
      { booking: booking._id, status: 'held' },
      { $set: { status: 'confirmed' }, $unset: { holdExpiresAt: 1 } },
      { session }
    ).exec();
    await InventoryUnit.updateMany(
      { _id: { $in: booking.items.map((item) => item.unit) }, status: { $nin: ['retired', 'maintenance'] } },
      { $set: { status: 'reserved' } },
      { session }
    ).exec();
    for (const [productId, count] of countByReference(booking.items, 'product')) {
      const updated = await Product.updateOne(
        { _id: productId, rentCount: { $lte: Number.MAX_SAFE_INTEGER - count } },
        { $inc: { rentCount: count } },
        { session }
      ).exec();
      if (updated.modifiedCount !== 1) {
        throw new ApiError(409, 'Product rental count could not be updated');
      }
    }
    for (const [unitId, count] of countByReference(booking.items, 'unit')) {
      const unit = await InventoryUnit.findById(unitId).session(session).exec();
      if (!unit) throw new ApiError(409, 'An inventory unit could not be loaded for booking confirmation');
      if (!Number.isSafeInteger(unit.rentCount + count)) {
        throw new ApiError(409, 'Inventory rental count exceeds the safe integer range');
      }
      unit.rentCount += count;
      await unit.save({ session });
    }
    await InventoryUnit.updateMany(
      { _id: { $in: booking.items.map((item) => item.unit) }, $expr: { $gte: ['$rentCount', '$maxRentCount'] } },
      { $set: { status: 'retired' } },
      { session }
    ).exec();

    if (booking.pricing.couponCode) {
      const coupon = await Coupon.findOne({ code: booking.pricing.couponCode }).session(session).exec();
      if (coupon) {
        await CouponRedemption.create(
          [{
            coupon: coupon._id,
            user: booking.user,
            booking: booking._id,
            amount: booking.pricing.discount,
          }],
          { session }
        );
        await Coupon.updateOne(
          { _id: coupon._id, reservedCount: { $gt: 0 } },
          { $inc: { reservedCount: -1, usedCount: 1 } },
          { session }
        ).exec();
      }
    }

    const purchasedLines = booking.items.map((item) => ({
      variant: item.variant,
      startDate: item.startDate,
      endDate: item.endDate,
    }));
    await Cart.updateOne(
      { user: booking.user },
      { $pull: { items: { $or: purchasedLines } },
        $set: { updatedAt: new Date() } },
      { session }
    ).exec();
    const rentalStart = booking.items.reduce(
      (date, item) => !date || item.startDate < date ? item.startDate : date,
      null
    );
    const rentalEnd = booking.items.reduce(
      (date, item) => !date || item.endDate > date ? item.endDate : date,
      null
    );
    await recordUserNotification({
      userId: booking.user,
      type: 'booking_confirmed',
      title: 'Booking confirmed',
      body: `Your WardroWave booking ${booking.bookingNumber} is confirmed.`,
      data: { bookingId: booking._id, bookingNumber: booking.bookingNumber },
      eventKey: `booking:${booking._id}:confirmed`,
      emailText: `Your WardroWave booking ${booking.bookingNumber} is confirmed. You can view the booking in your account.`,
      emailTemplate: 'booking-confirmed',
      emailContext: {
        bookingNumber: booking.bookingNumber,
        itemsSummary: booking.items.map((item) => item.titleSnapshot).join(', '),
        startDate: formatRentalDate(rentalStart),
        endDate: formatRentalDate(rentalEnd),
        address: [
          booking.shippingAddress.line1,
          booking.shippingAddress.city,
          booking.shippingAddress.state,
          booking.shippingAddress.pincode,
        ].filter(Boolean).join(', '),
        grandTotal: formatINR(booking.pricing.grandTotal),
        depositTotal: formatINR(booking.pricing.depositTotal),
        invoiceUrl: `${env.FRONTEND_URL}/account/bookings/${booking._id}`,
      },
      session,
    });
    await notifyAdmins({
      eventKey: `booking:${booking._id}:admin-new-order`,
      type: 'admin_new_order',
      title: 'New paid booking',
      body: `Booking ${booking.bookingNumber} has been paid.`,
      data: { bookingId: booking._id, bookingNumber: booking.bookingNumber },
      emailTemplate: 'admin-new-order',
      emailContext: {
        bookingNumber: booking.bookingNumber,
        customerEmail: (await User.findById(booking.user).select('email').session(session).lean().exec())?.email ?? '',
        grandTotal: formatINR(booking.pricing.grandTotal),
        startDate: formatRentalDate(rentalStart),
        endDate: formatRentalDate(rentalEnd),
      },
      session,
    });
    return { booking, duplicate: false, needsRefund: false };
  });

  if (outcome.needsRefund) {
    await createRefund({
      booking: outcome.booking,
      payment: outcome.storedPayment,
      amount: outcome.storedPayment.amount,
      reason: outcome.staleOrder ? 'admin_goodwill' : 'failed_delivery',
      notes: outcome.staleOrder
        ? 'Automatic refund because a superseded Razorpay order was captured'
        : 'Automatic refund because payment arrived after the reservation hold expired',
    });
    return {
      confirmed: false,
      refundPending: true,
      staleOrder: Boolean(outcome.staleOrder),
      bookingId: outcome.booking._id,
    };
  }
  if (outcome.staleOrder) {
    return {
      confirmed: false,
      refundPending: true,
      staleOrder: true,
      bookingId: outcome.booking._id,
      idempotent: true,
    };
  }
  if (outcome.expired) {
    return {
      confirmed: false,
      refundPending: Boolean(outcome.storedPayment),
      bookingId: outcome.booking._id,
      idempotent: true,
    };
  }

  if (!outcome.duplicate) {
    paymentLogger.info(
      { bookingId: outcome.booking._id, paymentId, orderId, source },
      'Payment confirmed'
    );
  }
  return { confirmed: true, bookingId: outcome.booking._id, idempotent: outcome.duplicate };
}

/**
 * Creates a refund record after checking the remaining refundable captured balance.
 */
export async function createRefundRecord({ booking, payment, amount, reason, initiatedBy, notes, session }) {
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw new ApiError(400, 'Refund amount must be a positive integer in paise');
  }
  const reservation = await Payment.updateOne(
    {
      _id: payment._id,
      status: { $in: ['captured', 'partially_refunded'] },
      $expr: {
        $lte: [
          {
            $add: [
              { $ifNull: ['$refundedAmount', 0] },
              { $ifNull: ['$refundReservedAmount', 0] },
              amount,
            ],
          },
          '$amount',
        ],
      },
    },
    { $inc: { refundReservedAmount: amount } },
    { session }
  ).exec();
  if (reservation.modifiedCount !== 1) {
    const alreadyRefunded = await Refund.aggregate([
      { $match: { payment: payment._id, status: { $in: ['pending', 'processed'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]).session(session);
    throw new ApiError(400, 'Refund amount exceeds the remaining refundable balance', {
      refundable: payment.amount - (alreadyRefunded[0]?.total ?? 0),
    });
  }
  const [refund] = await Refund.create(
    [{
      booking: booking._id,
      payment: payment._id,
      amount,
      reason,
      initiatedBy,
      notes,
      status: 'pending',
    }],
    { session }
  );
  return refund;
}

/**
 * Submits an existing pending refund to Razorpay without changing the amount.
 */
export async function submitRefund(refundId) {
  const now = new Date();
  const retryCutoff = new Date(now.getTime() - 10 * 60_000);
  const refund = await Refund.findOneAndUpdate(
    {
      _id: refundId,
      status: 'pending',
      razorpayRefundId: { $exists: false },
      submissionAttempts: { $lt: 5 },
      $or: [
        { lastAttemptAt: { $exists: false } },
        { lastAttemptAt: { $lte: retryCutoff } },
      ],
    },
    { $inc: { submissionAttempts: 1 }, $set: { lastAttemptAt: now } },
    { new: true }
  )
    .populate('payment')
    .exec();
  if (!refund) return null;
  try {
    const response = await getRazorpay().payments.refund(refund.payment.razorpayPaymentId, {
      amount: refund.amount,
      notes: { bookingId: String(refund.booking), reason: refund.reason },
    });
    refund.razorpayRefundId = response.id;
    refund.lastError = undefined;
    await refund.save();
    paymentLogger.info(
      {
        refundId: refund._id,
        bookingId: refund.booking,
        paymentId: refund.payment._id,
        attempt: refund.submissionAttempts,
      },
      'Refund initiated'
    );
  } catch (error) {
    refund.lastError = error.message.slice(0, 1000);
    refund.notes = [refund.notes, `Razorpay refund initiation failed: ${error.message}`]
      .filter(Boolean)
      .join('\n');
    await refund.save();
    logger.error({ err: error, refundId: refund._id }, 'Razorpay refund initiation failed');
    if (refund.submissionAttempts >= 5 && !refund.escalatedAt) {
      refund.escalatedAt = new Date();
      await refund.save();
      try {
        await notifyAdmins({
          eventKey: `refund:${refund._id}:escalated`,
          type: 'admin_refund_escalated',
          title: 'Refund needs manual attention',
          body: `Refund ${refund._id} for booking ${refund.booking} failed after five submission attempts.`,
          data: { refundId: refund._id, bookingId: refund.booking, amount: refund.amount },
          emailSubject: 'WardroWave refund requires attention',
        });
      } catch (notificationError) {
        logger.error(
          { err: notificationError, refundId: refund._id },
          'Failed to notify admins about an exhausted refund'
        );
      }
    }
  }
  return refund;
}

/**
 * Reserves refundable balance, creates a refund record, and submits it to Razorpay.
 */
export async function createRefund({ booking, payment, amount, reason, initiatedBy, notes, session }) {
  let refund;
  if (session) {
    refund = await createRefundRecord({ booking, payment, amount, reason, initiatedBy, notes, session });
  } else {
    refund = await withTransaction((transactionSession) =>
      createRefundRecord({
        booking,
        payment,
        amount,
        reason,
        initiatedBy,
        notes,
        session: transactionSession,
      })
    );
  }
  try {
    if (!session) await submitRefund(refund._id);
  } catch (error) {
    logger.error({ err: error, refundId: refund._id }, 'Unexpected refund submission failure');
  }
  return refund;
}

/**
 * Applies a signed webhook event's business transition idempotently.
 */
export async function processRazorpayEvent(event) {
  const paymentEntity = event.payload?.payment?.entity;
  if (['payment.captured', 'order.paid', 'payment.authorized'].includes(event.event)) {
    const orderId = paymentEntity?.order_id ?? event.payload?.order?.entity?.id;
    const paymentId = paymentEntity?.id;
    if (!orderId || !paymentId) return;
    if (event.event === 'payment.authorized') {
      await Payment.updateOne(
        { razorpayOrderId: orderId, status: { $ne: 'captured' } },
        { $set: { status: 'authorized', razorpayPaymentId: paymentId } }
      ).exec();
      return;
    }
    await confirmPayment({
      orderId,
      paymentId,
      source: 'webhook',
      payment: paymentEntity,
    });
    return;
  }

  if (event.event === 'payment.failed' && paymentEntity?.order_id) {
    await withTransaction(async (session) => {
      const payment = await Payment.findOne({
        razorpayOrderId: paymentEntity.order_id,
        status: { $ne: 'captured' },
      }).session(session).exec();
      if (!payment) return;
      payment.status = 'failed';
      payment.errorCode = paymentEntity.error_code;
      payment.errorDescription = paymentEntity.error_description;
      payment.attempts.push({
        at: new Date(),
        status: 'failed',
        errorCode: paymentEntity.error_code,
        errorDescription: paymentEntity.error_description,
      });
      await payment.save({ session });

      const booking = await Booking.findById(payment.booking).session(session).exec();
      if (!booking || booking.status !== 'pending_payment' || !booking.holdExpiresAt || booking.holdExpiresAt <= new Date()) {
        return;
      }
      const failureReason = paymentEntity.error_description || 'Please try another payment method.';
      await recordUserNotification({
        userId: booking.user,
        type: 'payment_failed',
        title: 'Payment was not completed',
        body: `Payment for booking ${booking.bookingNumber} did not complete. You can retry before the hold expires.`,
        data: { bookingId: booking._id, bookingNumber: booking.bookingNumber },
        eventKey: `booking:${booking._id}:payment-failed:${paymentEntity.id}`,
        emailTemplate: 'payment-failed',
        emailContext: {
          bookingNumber: booking.bookingNumber,
          failureReason,
          holdExpiresAt: booking.holdExpiresAt.toISOString(),
          retryUrl: `${env.FRONTEND_URL}/checkout?bookingId=${booking._id}`,
        },
        session,
      });
    });
    return;
  }

  const refundEntity = event.payload?.refund?.entity;
  if (['refund.processed', 'refund.failed', 'refund.created'].includes(event.event) && refundEntity?.id) {
    const status = event.event === 'refund.processed'
      ? 'processed'
      : event.event === 'refund.failed'
        ? 'failed'
        : 'pending';
    const updated = await Refund.findOneAndUpdate(
      {
        razorpayRefundId: refundEntity.id,
        ...(status === 'pending' ? {} : { status: 'pending' }),
      },
      {
        $set: {
          status,
          ...(status === 'processed' ? { processedAt: new Date(refundEntity.created_at * 1000) } : {}),
        },
      }
    ).exec();
    if (updated && status === 'processed' && updated.status !== 'processed') {
      await Payment.updateOne(
        { _id: updated.payment },
        [
          {
            $set: {
              refundedAmount: {
                $add: [{ $ifNull: ['$refundedAmount', 0] }, updated.amount],
              },
              refundReservedAmount: {
                $subtract: [{ $ifNull: ['$refundReservedAmount', 0] }, updated.amount],
              },
            },
          },
          {
            $set: {
              status: {
                $cond: [
                  { $gte: ['$refundedAmount', '$amount'] },
                  'refunded',
                  'partially_refunded',
                ],
              },
            },
          },
        ]
      ).exec();
      const payment = await Payment.findById(updated.payment).select('status').lean().exec();
      if (payment) {
        await Booking.updateOne(
          { _id: updated.booking },
          { $set: { 'payment.status': payment.status } }
        ).exec();
      }
      const booking = await Booking.findById(updated.booking).lean().exec();
      if (booking) {
        await recordUserNotification({
          userId: booking.user,
          type: 'refund_processed',
          title: 'Your refund has been processed',
          body: `Your refund of ${formatINR(updated.amount)} for booking ${booking.bookingNumber} has been processed.`,
          data: { bookingId: booking._id, bookingNumber: booking.bookingNumber, refundId: updated._id },
          eventKey: `refund:${updated._id}:processed`,
          emailTemplate: 'refund-processed',
          emailContext: {
            bookingNumber: booking.bookingNumber,
            refundAmount: formatINR(updated.amount),
          },
        });
      }
    } else if (updated && status === 'failed' && updated.status !== 'failed') {
      await Payment.updateOne(
        { _id: updated.payment },
        { $inc: { refundReservedAmount: -updated.amount } }
      ).exec();
    }
  }
}

/**
 * Verifies, persists, and asynchronously handles one Razorpay webhook delivery.
 */
export async function acceptRazorpayWebhook({ rawBody, signature, eventId }) {
  if (!env.RAZORPAY_WEBHOOK_SECRET) throw new ApiError(503, 'Webhook signing secret is not configured');
  if (!Buffer.isBuffer(rawBody) || !signature || !eventId) {
    throw new ApiError(400, 'Webhook body, event ID, and signature are required');
  }
  const expected = hmacSha256(rawBody, env.RAZORPAY_WEBHOOK_SECRET);
  if (!timingSafeCompareHex(expected, signature)) {
    throw new ApiError(400, 'Webhook signature is invalid', undefined, 'INVALID_WEBHOOK_SIGNATURE');
  }

  let payload;
  try {
    payload = JSON.parse(rawBody.toString('utf8'));
  } catch {
    throw new ApiError(400, 'Webhook body must contain valid JSON');
  }
  if (!payload.event || typeof payload.event !== 'string') {
    throw new ApiError(400, 'Webhook event name is required');
  }

  let duplicate = false;
  try {
    await WebhookEvent.create({
      eventId,
      event: payload.event,
      payload,
      status: 'received',
      nextAttemptAt: new Date(),
    });
  } catch (error) {
    if (error.code !== 11000) throw error;
    duplicate = true;
  }

  const processed = await processRazorpayWebhookEvent(eventId);
  if (!processed) {
    const storedEvent = await WebhookEvent.findOne({ eventId })
      .select('status attempts')
      .lean()
      .exec();
    if (storedEvent?.status === 'processed') return { accepted: true, duplicate: true };
    if (storedEvent?.status === 'failed' && storedEvent.attempts >= WEBHOOK_MAX_ATTEMPTS) {
      return { accepted: true, duplicate: true };
    }
    throw new ApiError(
      503,
      'Webhook event processing is pending retry',
      'WEBHOOK_PROCESSING_PENDING'
    );
  }

  return { accepted: true, duplicate };
}

const WEBHOOK_MAX_ATTEMPTS = 12;
const WEBHOOK_PROCESSING_LEASE_MS = 10 * 60_000;

/**
 * Claims and processes one persisted webhook event, allowing stale or failed events to retry.
 */
export async function processRazorpayWebhookEvent(eventId, now = new Date()) {
  const event = await WebhookEvent.findOneAndUpdate(
    {
      eventId,
      $and: [
        { $or: [{ attempts: { $lt: WEBHOOK_MAX_ATTEMPTS } }, { attempts: { $exists: false } }] },
        { $or: [
          { status: 'received', $or: [{ nextAttemptAt: { $lte: now } }, { nextAttemptAt: { $exists: false } }] },
          { status: 'failed', $or: [{ nextAttemptAt: { $lte: now } }, { nextAttemptAt: { $exists: false } }] },
          {
            status: 'processing',
            processingStartedAt: { $lte: new Date(now.getTime() - WEBHOOK_PROCESSING_LEASE_MS) },
          },
        ] },
      ],
    },
    {
      $set: { status: 'processing', processingStartedAt: now, lastAttemptAt: now },
      $inc: { attempts: 1 },
      $unset: { error: 1 },
    },
    { new: true }
  ).select('+payload').exec();
  if (!event) return false;

  try {
    await processRazorpayEvent(event.payload);
    await WebhookEvent.updateOne(
      { _id: event._id, status: 'processing' },
      {
        $set: { status: 'processed', processedAt: new Date() },
        $unset: { processingStartedAt: 1, nextAttemptAt: 1, error: 1 },
      }
    ).exec();
    return true;
  } catch (error) {
    const retryDelayMs = Math.min(60 * 60_000, 30_000 * (2 ** Math.min(event.attempts - 1, 7)));
    await WebhookEvent.updateOne(
      { _id: event._id, status: 'processing' },
      {
        $set: {
          status: 'failed',
          error: 'Webhook processing failed',
          nextAttemptAt: new Date(Date.now() + retryDelayMs),
        },
        $unset: { processingStartedAt: 1, processedAt: 1 },
      }
    ).exec();
    if (event.attempts >= WEBHOOK_MAX_ATTEMPTS) {
      logger.error(
        { eventId, event: event.event, attempts: event.attempts },
        'Razorpay webhook reached its retry limit; manual reconciliation is required'
      );
    }
    logger.error(
      { err: error, eventId, event: event.event, attempt: event.attempts },
      'Razorpay webhook processing failed'
    );
    return false;
  }
}

/**
 * Retries due webhook events and recovers events left claimed by a crashed process.
 */
export async function retryPendingRazorpayWebhooks(now = new Date()) {
  const staleBefore = new Date(now.getTime() - WEBHOOK_PROCESSING_LEASE_MS);
  const pending = await WebhookEvent.find({
    $and: [
      { $or: [{ attempts: { $lt: WEBHOOK_MAX_ATTEMPTS } }, { attempts: { $exists: false } }] },
      { $or: [
        { status: 'received', $or: [{ nextAttemptAt: { $lte: now } }, { nextAttemptAt: { $exists: false } }] },
        { status: 'failed', $or: [{ nextAttemptAt: { $lte: now } }, { nextAttemptAt: { $exists: false } }] },
        { status: 'processing', processingStartedAt: { $lte: staleBefore } },
      ] },
    ],
  })
    .select('eventId')
    .sort({ nextAttemptAt: 1, createdAt: 1 })
    .limit(10)
    .lean()
    .exec();

  let processed = 0;
  for (const { eventId } of pending) {
    if (await processRazorpayWebhookEvent(eventId, now)) processed += 1;
  }
  return { attempted: pending.length, processed };
}
