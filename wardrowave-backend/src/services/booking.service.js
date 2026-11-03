import { env } from '../config/env.js';
import { getRazorpay } from '../config/razorpay.js';
import { Booking } from '../models/Booking.js';
import { Cart } from '../models/Cart.js';
import { Coupon } from '../models/Coupon.js';
import { CouponRedemption } from '../models/CouponRedemption.js';
import { Counter } from '../models/Counter.js';
import { InventoryUnit } from '../models/InventoryUnit.js';
import { Payment } from '../models/Payment.js';
import { Reservation } from '../models/Reservation.js';
import { ServiceablePincode } from '../models/ServiceablePincode.js';
import { Variant } from '../models/Variant.js';
import { ApiError } from '../utils/ApiError.js';
import { computeBlockWindow, validateRentalWindow } from '../utils/dates.js';
import { withTransaction } from '../utils/withTransaction.js';
import { getAvailableUnits } from './availability.service.js';
import { calculateRentalCharge, quote as calculateQuote } from './pricing.service.js';
import { getRentalSettings } from './settings.service.js';
import { logger } from '../utils/logger.js';

const bookingLogger = logger.child({ module: 'booking' });

/**
 * Generates a sequential, human-readable booking number within a transaction.
 */
async function nextBookingNumber(session) {
  const counter = await Counter.findOneAndUpdate(
    { _id: 'booking' },
    { $inc: { seq: 1 } },
    { upsert: true, new: true, session }
  ).exec();
  const period = new Date().toISOString().slice(2, 7).replace('-', '');
  return `WW-${period}-${String(counter.seq % 1_000_000).padStart(6, '0')}`;
}

/**
 * Searches other blocking reservations for a unit and rental window.
 */
async function hasReservationConflict({ unitId, blockStart, blockEnd, ownReservationId, session }) {
  const now = new Date();
  return Reservation.exists({
    unit: unitId,
    _id: { $ne: ownReservationId },
    blockStart: { $lte: blockEnd },
    blockEnd: { $gte: blockStart },
    $or: [
      { status: { $in: ['confirmed', 'active'] } },
      { status: 'held', holdExpiresAt: { $gt: now } },
    ],
  }).session(session);
}

/**
 * Reserves the first least-used free unit while serializing competing transactions.
 */
async function holdInventoryUnit({
  variant,
  product,
  userId,
  startDate,
  endDate,
  blockWindow,
  candidates,
  holdExpiresAt,
  session,
}) {
  for (const candidate of candidates) {
    const lock = await InventoryUnit.updateOne(
      { _id: candidate._id, status: { $nin: ['maintenance', 'retired'] } },
      { $inc: { reservationLockVersion: 1 } },
      { session }
    ).exec();
    if (lock.modifiedCount !== 1) continue;

    const [reservation] = await Reservation.create(
      [{
        unit: candidate._id,
        variant: variant._id,
        product: product._id,
        user: userId,
        rentalStart: startDate,
        rentalEnd: endDate,
        ...blockWindow,
        status: 'held',
        holdExpiresAt,
      }],
      { session }
    );
    if (
      await hasReservationConflict({
        unitId: candidate._id,
        blockStart: blockWindow.blockStart,
        blockEnd: blockWindow.blockEnd,
        ownReservationId: reservation._id,
        session,
      })
    ) {
      await Reservation.updateOne(
        { _id: reservation._id },
        { $set: { status: 'cancelled' } },
        { session }
      ).exec();
      continue;
    }
    return { unit: candidate, reservation };
  }
  return null;
}

/**
 * Creates a pending rental booking, places unit holds, and requests a Razorpay order.
 */
export async function createBooking({ user, body, idempotencyKey }) {
  if (!idempotencyKey || idempotencyKey.length > 128) {
    throw new ApiError(400, 'A valid Idempotency-Key header is required', undefined, 'IDEMPOTENCY_KEY_REQUIRED');
  }
  if (env.REQUIRE_VERIFIED_EMAIL && !user.emailVerified) {
    throw new ApiError(403, 'Verify your email address before checkout', undefined, 'EMAIL_NOT_VERIFIED');
  }

  let transactionResult;
  try {
    transactionResult = await withTransaction(async (session) => {
      const existing = await Booking.findOne({ user: user._id, idempotencyKey }).session(session).exec();
      if (existing) return { booking: existing, isExisting: true };

      const address = user.addresses.id(body.addressId);
      if (!address) throw new ApiError(404, 'Shipping address not found');
      const addressSnapshot = address.toObject();
      const pincode = addressSnapshot.pincode;
      const serviceable = await ServiceablePincode.exists({ pincode, isActive: true }).session(session);
      if (!serviceable) {
        throw new ApiError(400, 'Delivery is not available at this pincode', undefined, 'PINCODE_NOT_SERVICEABLE');
      }

      let sourceCart;
      let requestedItems = body.items;
      if (!requestedItems) {
        sourceCart = await Cart.findOne({ user: user._id }).session(session).lean().exec();
        if (!sourceCart || sourceCart.items.length === 0) throw new ApiError(400, 'Cart is empty');
        requestedItems = sourceCart.items.map((item) => ({
          variantId: item.variant,
          startDate: item.startDate,
          endDate: item.endDate,
        }));
      }
      if (requestedItems.length > 10) {
        throw new ApiError(400, 'A booking can contain at most 10 items');
      }

      const settings = await getRentalSettings({ session });
      const couponCode = (body.couponCode ?? sourceCart?.couponCode)?.trim().toUpperCase();
      const coupon = couponCode
        ? await Coupon.findOne({ code: couponCode, isActive: true, deletedAt: null }).session(session).lean().exec()
        : null;
      const quoteItems = [];
      const heldItems = [];
      const holdExpiresAt = new Date(Date.now() + settings.holdMinutes * 60_000);

      for (const requested of requestedItems) {
        const variant = await Variant.findOne({ _id: requested.variantId, isActive: true })
          .populate({ path: 'product', match: { status: 'published', deletedAt: null } })
          .session(session)
          .exec();
        if (!variant?.product) throw new ApiError(404, 'Product variant not found');

        const product = variant.product;
        const validated = validateRentalWindow(
          requested.startDate,
          requested.endDate,
          product,
          new Date(),
          settings
        );
        const productPricing = product.pricing;
        const blockWindow = computeBlockWindow(
          validated.startDate,
          validated.endDate,
          productPricing.deliveryBufferDays ?? settings.deliveryBufferDays,
          productPricing.returnBufferDays ?? settings.returnBufferDays
        );
        const candidates = await getAvailableUnits({
          variantId: variant._id,
          ...blockWindow,
          session,
        });
        const held = await holdInventoryUnit({
          variant,
          product,
          userId: user._id,
          startDate: validated.startDate,
          endDate: validated.endDate,
          blockWindow,
          candidates,
          holdExpiresAt,
          session,
        });
        if (!held) {
          throw new ApiError(
            409,
            `No unit is available for ${product.title} in the requested date range`,
            { variantId: String(variant._id) },
            'ITEM_UNAVAILABLE'
          );
        }

        const rentalCharge = calculateRentalCharge(product, validated.rentalDays);
        quoteItems.push({
          product: product.toObject(),
          variant: variant.toObject(),
          startDate: validated.startDate,
          endDate: validated.endDate,
          available: true,
          availableCount: candidates.length,
        });
        heldItems.push({
          product,
          variant,
          unit: held.unit,
          reservation: held.reservation,
          startDate: validated.startDate,
          endDate: validated.endDate,
          rentalDays: validated.rentalDays,
          rentalCharge,
          extraDays: Math.max(0, validated.rentalDays - productPricing.minRentalDays),
          securityDeposit: productPricing.securityDeposit,
        });
      }

      const redemptionCount = coupon
        ? await CouponRedemption.countDocuments({
            coupon: coupon._id,
            user: user._id,
            reversedAt: null,
          }).session(session)
        : 0;
      const priorBookingCount = await Booking.countDocuments({
        user: user._id,
        status: { $nin: ['cancelled', 'expired'] },
      }).session(session);
      const totals = calculateQuote({
        items: quoteItems,
        couponCode,
        coupon,
        pincode,
        pincodeServiceable: true,
        user: { bookingCount: priorBookingCount, couponRedemptionCount: redemptionCount },
        settings,
      });
      if (totals.failureReason === 'coupon_invalid') {
        throw new ApiError(400, 'Coupon is invalid or no longer available', undefined, 'COUPON_INVALID');
      }
      if (totals.failureReason) {
        throw new ApiError(400, 'One or more requested items are unavailable', {
          reason: totals.failureReason,
        });
      }

      if (coupon) {
        const filter = {
          _id: coupon._id,
          isActive: true,
          deletedAt: null,
          ...(coupon.usageLimit
            ? {
                $expr: {
                  $lt: [
                    {
                      $add: [
                        { $ifNull: ['$usedCount', 0] },
                        { $ifNull: ['$reservedCount', 0] },
                      ],
                    },
                    coupon.usageLimit,
                  ],
                },
              }
            : {}),
        };
        const reservation = await Coupon.updateOne(
          filter,
          { $inc: { reservedCount: 1 } },
          { session }
        ).exec();
        if (reservation.modifiedCount !== 1) {
          throw new ApiError(409, 'Coupon usage limit has been reached', undefined, 'COUPON_INVALID');
        }
      }

      const bookingNumber = await nextBookingNumber(session);
      const bookingItems = heldItems.map((held) => ({
        product: held.product._id,
        variant: held.variant._id,
        unit: held.unit._id,
        reservation: held.reservation._id,
        titleSnapshot: held.product.title,
        imageSnapshot:
          held.product.images.find((image) => image.isPrimary)?.url ??
          held.product.images[0]?.url,
        sizeSnapshot: held.variant.size,
        startDate: held.startDate,
        endDate: held.endDate,
        rentalDays: held.rentalDays,
        rentalCharge: held.rentalCharge,
        extraDays: held.extraDays,
        securityDeposit: held.securityDeposit,
        status: 'pending',
      }));
      const [booking] = await Booking.create(
        [{
          bookingNumber,
          user: user._id,
          items: bookingItems,
          shippingAddress: addressSnapshot,
          deliveryPincode: pincode,
          pricing: {
            rentalSubtotal: totals.rentalSubtotal,
            discount: totals.discount,
            couponCode: totals.couponCode,
            deliveryFee: totals.deliveryFee,
            taxableAmount: totals.taxableAmount,
            gstPercent: totals.gstPercent,
            gstAmount: totals.gstAmount,
            depositTotal: totals.depositTotal,
            grandTotal: totals.grandTotal,
            currency: 'INR',
          },
          status: 'pending_payment',
          holdExpiresAt,
          idempotencyKey,
          timeline: [{
            status: 'pending_payment',
            note: 'Booking created; payment pending',
            actor: user._id,
          }],
        }],
        { session }
      );
      await Reservation.updateMany(
        { _id: { $in: heldItems.map((held) => held.reservation._id) } },
        { $set: { booking: booking._id } },
        { session }
      ).exec();

      return { booking, isExisting: false };
    });
  } catch (error) {
    if (error.code !== 11000) throw error;
    const existing = await Booking.findOne({ user: user._id, idempotencyKey }).exec();
    if (!existing) throw error;
    transactionResult = { booking: existing, isExisting: true };
  }

  if (transactionResult.isExisting) {
    const payment = await Payment.findOne({ booking: transactionResult.booking._id }).lean().exec();
    if (transactionResult.booking.status === 'pending_payment' && !payment) {
      throw new ApiError(409, 'Payment order is not available for this booking');
    }
    return {
      booking: transactionResult.booking.toJSON(),
      razorpayOrderId: payment?.razorpayOrderId,
      amount: transactionResult.booking.pricing.grandTotal,
      currency: 'INR',
      keyId: env.RAZORPAY_KEY_ID,
      prefill: { name: user.name, email: user.email, contact: user.phone },
      idempotent: true,
    };
  }

  const booking = transactionResult.booking;
  try {
    const razorpayOrder = await getRazorpay().orders.create({
      amount: booking.pricing.grandTotal,
      currency: 'INR',
      receipt: booking.bookingNumber,
      notes: { bookingId: String(booking._id), userId: String(user._id) },
    });
    await withTransaction(async (session) => {
      await Payment.create(
        [{
          booking: booking._id,
          user: user._id,
          razorpayOrderId: razorpayOrder.id,
          amount: booking.pricing.grandTotal,
          currency: 'INR',
          status: 'created',
        }],
        { session }
      );
      await Booking.updateOne(
        { _id: booking._id, status: 'pending_payment' },
        { $set: { 'payment.razorpayOrderId': razorpayOrder.id, 'payment.status': 'created' } },
        { session }
      ).exec();
    });
    booking.payment.razorpayOrderId = razorpayOrder.id;
    booking.payment.status = 'created';
    bookingLogger.info(
      { bookingId: booking._id, bookingNumber: booking.bookingNumber, userId: user._id },
      'Booking created'
    );

    return {
      booking: booking.toJSON(),
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: env.RAZORPAY_KEY_ID,
      prefill: { name: user.name, email: user.email, contact: user.phone },
      idempotent: false,
    };
  } catch (error) {
    await withTransaction(async (session) => {
      await Booking.updateOne(
        { _id: booking._id, status: 'pending_payment' },
        {
          $set: { status: 'payment_failed', 'payment.status': 'failed' },
          $push: {
            timeline: {
              status: 'payment_failed',
              note: 'Payment order creation failed',
              actor: user._id,
            },
          },
        },
        { session }
      ).exec();
      await Reservation.updateMany(
        { booking: booking._id, status: 'held' },
        { $set: { status: 'cancelled' } },
        { session }
      ).exec();
      if (booking.pricing.couponCode) {
        await Coupon.updateOne(
          { code: booking.pricing.couponCode, reservedCount: { $gt: 0 } },
          { $inc: { reservedCount: -1 } },
          { session }
        ).exec();
      }
    });
    throw error;
  }
}

/**
 * Replaces the pending Razorpay order once and extends the checkout hold.
 */
export async function retryPayment({ bookingId, user }) {
  const settings = await getRentalSettings();
  const booking = await withTransaction(async (session) => {
    const current = await Booking.findOne({
      _id: bookingId,
      user: user._id,
      status: 'pending_payment',
      holdExpiresAt: { $gt: new Date() },
    }).session(session).exec();
    if (!current) throw new ApiError(404, 'Active pending booking not found');
    if (current.payment.retryCount >= 1) {
      throw new ApiError(409, 'Payment retry has already been used', undefined, 'PAYMENT_RETRY_EXHAUSTED');
    }

    if (current.payment.razorpayOrderId) {
      await Payment.updateOne(
        { razorpayOrderId: current.payment.razorpayOrderId, status: { $ne: 'captured' } },
        { $set: { status: 'failed', errorDescription: 'Superseded by a payment retry' } },
        { session }
      ).exec();
    }
    current.payment.razorpayOrderId = undefined;
    current.payment.status = 'created';
    current.payment.retryCount += 1;
    current.holdExpiresAt = new Date(Date.now() + settings.holdMinutes * 60_000);
    current.timeline.push({
      status: 'pending_payment',
      note: 'Payment retry started; checkout hold extended',
      actor: user._id,
    });
    await current.save({ session });
    return current;
  });

  try {
    const order = await getRazorpay().orders.create({
      amount: booking.pricing.grandTotal,
      currency: 'INR',
      receipt: booking.bookingNumber,
      notes: { bookingId: String(booking._id), userId: String(user._id), retry: 'true' },
    });
    await withTransaction(async (session) => {
      await Payment.create(
        [{
          booking: booking._id,
          user: user._id,
          razorpayOrderId: order.id,
          amount: booking.pricing.grandTotal,
          currency: 'INR',
          status: 'created',
        }],
        { session }
      );
      await Booking.updateOne(
        { _id: booking._id, status: 'pending_payment' },
        { $set: { 'payment.razorpayOrderId': order.id, 'payment.status': 'created' } },
        { session }
      ).exec();
    });
    booking.payment.razorpayOrderId = order.id;
    booking.payment.status = 'created';
    return {
      booking: booking.toJSON(),
      razorpayOrderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: env.RAZORPAY_KEY_ID,
      prefill: { name: user.name, email: user.email, contact: user.phone },
    };
  } catch (error) {
    await Booking.updateOne(
      { _id: booking._id, status: 'pending_payment' },
      { $set: { 'payment.status': 'failed' } }
    ).exec();
    throw error;
  }
}

/**
 * Returns a customer-owned booking or a not-found response for foreign resources.
 */
export async function getBookingById(id, userId) {
  const booking = await Booking.findOne({ _id: id, user: userId }).lean().exec();
  if (!booking) throw new ApiError(404, 'Booking not found');
  return booking;
}

export async function listBookings(userId, { page = 1, limit = 20 } = {}) {
  const filter = { user: userId };
  const [items, total] = await Promise.all([
    Booking.find(filter)
      .select('-user -idempotencyKey')
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()
      .exec(),
    Booking.countDocuments(filter).exec(),
  ]);
  return {
    items,
    meta: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}
