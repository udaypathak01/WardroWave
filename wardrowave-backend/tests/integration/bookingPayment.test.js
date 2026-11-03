import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { env } from '../../src/config/env.js';
import { Booking } from '../../src/models/Booking.js';
import { Cart } from '../../src/models/Cart.js';
import { Coupon } from '../../src/models/Coupon.js';
import { CouponRedemption } from '../../src/models/CouponRedemption.js';
import { InventoryUnit } from '../../src/models/InventoryUnit.js';
import { Payment } from '../../src/models/Payment.js';
import { Product } from '../../src/models/Product.js';
import { Refund } from '../../src/models/Refund.js';
import { Reservation } from '../../src/models/Reservation.js';
import { ServiceablePincode } from '../../src/models/ServiceablePincode.js';
import { WebhookEvent } from '../../src/models/WebhookEvent.js';
import { createBooking, getBookingById, retryPayment } from '../../src/services/booking.service.js';
import {
  createRefund,
  createRefundRecord,
  acceptRazorpayWebhook,
  confirmPayment,
  processRazorpayEvent,
  processRazorpayWebhookEvent,
  retryPendingRazorpayWebhooks,
  submitRefund,
  verifyPayment,
} from '../../src/services/payment.service.js';
import { invalidateRentalSettingsCache } from '../../src/services/settings.service.js';
import { addCalendarDays, formatRentalDate } from '../../src/utils/dates.js';
import { withTransaction } from '../../src/utils/withTransaction.js';
import {
  createProductWithUnits,
  createUser,
  signRazorpay,
  signWebhook,
} from '../helpers/factories.js';
import { mockRazorpay } from '../helpers/providerMocks.js';

const enabled = process.env.RUN_MONGO_INTEGRATION === 'true';
const integrationIt = enabled ? it : it.skip;
let user;
let product;
let variant;
let unit;
let requestBody;
let startDate;
let endDate;

async function createCapturedCheckout(idempotencyKey, paymentId) {
  const checkout = await createBooking({
    user,
    body: requestBody,
    idempotencyKey,
  });
  mockRazorpay({
    fetchPayment: async () => ({
      id: paymentId,
      order_id: checkout.razorpayOrderId,
      amount: checkout.amount,
      status: 'captured',
    }),
  });
  await verifyPayment({
    userId: user._id,
    orderId: checkout.razorpayOrderId,
    paymentId,
    signature: signRazorpay(checkout.razorpayOrderId, paymentId),
  });
  return {
    checkout,
    booking: await Booking.findById(checkout.booking._id),
    payment: await Payment.findOne({ booking: checkout.booking._id }),
  };
}

beforeEach(async () => {
  if (!enabled) return;

  invalidateRentalSettingsCache();
  mockRazorpay();
  user = await createUser();
  ({ product, variant, units: [unit] } = await createProductWithUnits());
  await ServiceablePincode.create({
    pincode: user.addresses[0].pincode,
    city: user.addresses[0].city,
    state: user.addresses[0].state,
    deliveryDays: 2,
    isActive: true,
  });

  startDate = formatRentalDate(addCalendarDays(new Date(), 10));
  endDate = formatRentalDate(addCalendarDays(new Date(startDate), 2));
  requestBody = {
    addressId: user.addresses[0]._id.toString(),
    items: [{ variantId: variant._id.toString(), startDate, endDate }],
  };
});

describe('booking and payment integration', () => {
  integrationIt('retries persisted webhook events that failed processing', async () => {
    const eventId = 'event-retry-test';
    await WebhookEvent.create({
      eventId,
      event: 'payment.captured',
      payload: {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'payment-without-local-order',
              order_id: 'order-without-local-record',
            },
          },
        },
      },
    });

    await expect(processRazorpayWebhookEvent(eventId)).resolves.toBe(false);
    await expect(WebhookEvent.findOne({ eventId }).lean()).resolves.toMatchObject({
      status: 'failed',
      attempts: 1,
      error: 'Webhook processing failed',
    });

    await WebhookEvent.updateOne(
      { eventId },
      { $set: { nextAttemptAt: new Date(Date.now() - 1_000) } }
    );
    await expect(retryPendingRazorpayWebhooks()).resolves.toEqual({
      attempted: 1,
      processed: 0,
    });
    await expect(WebhookEvent.findOne({ eventId }).lean()).resolves.toMatchObject({
      status: 'failed',
      attempts: 2,
    });
  });

  async function createCoupon(overrides = {}) {
    return Coupon.create({
      code: 'INTEGRATION10',
      type: 'percent',
      value: 10,
      maxDiscount: 5000,
      startsAt: new Date('2026-01-01T00:00:00Z'),
      expiresAt: new Date('2027-01-01T00:00:00Z'),
      isActive: true,
      ...overrides,
    });
  }

  integrationIt('rejects invalid checkout requests before creating bookings or holds', async () => {
    await expect(createBooking({
      user,
      body: requestBody,
      idempotencyKey: '',
    })).rejects.toMatchObject({ statusCode: 400, code: 'IDEMPOTENCY_KEY_REQUIRED' });
    await expect(createBooking({
      user,
      body: requestBody,
      idempotencyKey: 'x'.repeat(129),
    })).rejects.toMatchObject({ statusCode: 400, code: 'IDEMPOTENCY_KEY_REQUIRED' });

    await expect(createBooking({
      user,
      body: { addressId: user.addresses[0]._id.toString() },
      idempotencyKey: 'integration-empty-cart',
    })).rejects.toMatchObject({ statusCode: 400 });

    await expect(createBooking({
      user,
      body: { ...requestBody, addressId: '000000000000000000000000' },
      idempotencyKey: 'integration-missing-address',
    })).rejects.toMatchObject({ statusCode: 404 });

    await expect(createBooking({
      user,
      body: {
        ...requestBody,
        items: Array.from({ length: 11 }, () => requestBody.items[0]),
      },
      idempotencyKey: 'integration-too-many-items',
    })).rejects.toMatchObject({ statusCode: 400 });

    await expect(createBooking({
      user,
      body: {
        ...requestBody,
        items: [{ ...requestBody.items[0], variantId: '000000000000000000000000' }],
      },
      idempotencyKey: 'integration-missing-variant',
    })).rejects.toMatchObject({ statusCode: 404 });

    await expect(createBooking({
      user,
      body: {
        ...requestBody,
        items: [{ ...requestBody.items[0], startDate: '2026-02-31' }],
      },
      idempotencyKey: 'integration-invalid-dates',
    })).rejects.toMatchObject({ statusCode: 400, code: 'INVALID_DATES' });

    await InventoryUnit.updateOne({ _id: unit._id }, { $set: { status: 'cleaning' } });
    await expect(createBooking({
      user,
      body: requestBody,
      idempotencyKey: 'integration-no-available-unit',
    })).rejects.toMatchObject({ statusCode: 409, code: 'ITEM_UNAVAILABLE' });
    await InventoryUnit.updateOne({ _id: unit._id }, { $set: { status: 'available' } });

    const requiredVerifiedEmail = env.REQUIRE_VERIFIED_EMAIL;
    env.REQUIRE_VERIFIED_EMAIL = true;
    try {
      await expect(createBooking({
        user: { ...user.toObject(), emailVerified: false },
        body: requestBody,
        idempotencyKey: 'integration-unverified-email',
      })).rejects.toMatchObject({ statusCode: 403, code: 'EMAIL_NOT_VERIFIED' });
    } finally {
      env.REQUIRE_VERIFIED_EMAIL = requiredVerifiedEmail;
    }

    await ServiceablePincode.deleteMany({});
    await expect(createBooking({
      user,
      body: requestBody,
      idempotencyKey: 'integration-unserviceable-pincode',
    })).rejects.toMatchObject({ statusCode: 400, code: 'PINCODE_NOT_SERVICEABLE' });
    await expect(Booking.countDocuments({ user: user._id })).resolves.toBe(0);
    await expect(Reservation.countDocuments({ user: user._id })).resolves.toBe(0);
  });

  integrationIt('aborts checkout when a unit becomes conflicted after availability selection', async () => {
    const conflictQuery = Promise.resolve({ _id: 'concurrent-reservation' });
    conflictQuery.session = () => conflictQuery;
    const exists = jest.spyOn(Reservation, 'exists').mockReturnValue(conflictQuery);

    try {
      await expect(createBooking({
        user,
        body: requestBody,
        idempotencyKey: 'integration-unit-conflict',
      })).rejects.toMatchObject({ statusCode: 409, code: 'ITEM_UNAVAILABLE' });
    } finally {
      exists.mockRestore();
    }

    await expect(Booking.countDocuments({ user: user._id })).resolves.toBe(0);
    await expect(Reservation.countDocuments({ user: user._id })).resolves.toBe(0);
  });

  integrationIt('creates a held checkout and returns the same order for an idempotent retry', async () => {
    const first = await createBooking({
      user,
      body: requestBody,
      idempotencyKey: 'integration-checkout',
    });
    const retry = await createBooking({
      user,
      body: requestBody,
      idempotencyKey: 'integration-checkout',
    });

    expect(first.booking.status).toBe('pending_payment');
    expect(first.razorpayOrderId).toBe('order_test');
    expect(retry.idempotent).toBe(true);
    expect(retry.razorpayOrderId).toBe(first.razorpayOrderId);
    expect(await Booking.countDocuments({ user: user._id })).toBe(1);
    expect(await Payment.countDocuments({ booking: first.booking._id })).toBe(1);
    expect(await Reservation.countDocuments({ booking: first.booking._id, status: 'held' })).toBe(1);

    await Payment.deleteMany({ booking: first.booking._id });
    await expect(createBooking({
      user,
      body: requestBody,
      idempotencyKey: 'integration-checkout',
    })).rejects.toMatchObject({ statusCode: 409 });
  });

  integrationIt('creates a checkout from the customer cart when line items are omitted', async () => {
    await Cart.create({
      user: user._id,
      items: [{
        product: product._id,
        variant: variant._id,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      }],
    });

    const checkout = await createBooking({
      user,
      body: { addressId: user.addresses[0]._id.toString() },
      idempotencyKey: 'integration-cart-checkout',
    });

    expect(checkout.booking.status).toBe('pending_payment');
    expect(checkout.booking.items).toHaveLength(1);
    expect(checkout.razorpayOrderId).toBe('order_test');
  });

  integrationIt('reserves an eligible coupon and redeems it only after payment confirmation', async () => {
    const coupon = await createCoupon({ usageLimit: 3 });
    const checkout = await createBooking({
      user,
      body: { ...requestBody, couponCode: coupon.code },
      idempotencyKey: 'integration-coupon-redemption',
    });

    await expect(Coupon.findById(coupon._id).lean())
      .resolves.toMatchObject({ reservedCount: 1, usedCount: 0 });
    await expect(CouponRedemption.countDocuments({ coupon: coupon._id })).resolves.toBe(0);

    mockRazorpay({
      fetchPayment: async (paymentId) => ({
        id: paymentId,
        order_id: checkout.razorpayOrderId,
        amount: checkout.amount,
        status: 'captured',
      }),
    });
    await verifyPayment({
      userId: user._id,
      orderId: checkout.razorpayOrderId,
      paymentId: 'payment-coupon-redemption',
      signature: signRazorpay(checkout.razorpayOrderId, 'payment-coupon-redemption'),
    });

    await expect(Coupon.findById(coupon._id).lean())
      .resolves.toMatchObject({ reservedCount: 0, usedCount: 1 });
    await expect(CouponRedemption.countDocuments({
      coupon: coupon._id,
      user: user._id,
      booking: checkout.booking._id,
    })).resolves.toBe(1);
  });

  integrationIt('rejects expired coupons and releases all provisional inventory state', async () => {
    await createCoupon({
      code: 'EXPIRED10',
      expiresAt: new Date('2026-01-01T00:00:00Z'),
    });

    await expect(createBooking({
      user,
      body: { ...requestBody, couponCode: 'EXPIRED10' },
      idempotencyKey: 'integration-expired-coupon',
    })).rejects.toMatchObject({ statusCode: 400, code: 'COUPON_INVALID' });
    await expect(Booking.countDocuments({ user: user._id })).resolves.toBe(0);
    await expect(Reservation.countDocuments({ user: user._id })).resolves.toBe(0);
  });

  integrationIt('enforces coupon capacity including other active reservations', async () => {
    const coupon = await createCoupon({ code: 'FULL10', usageLimit: 1, reservedCount: 1 });

    await expect(createBooking({
      user,
      body: { ...requestBody, couponCode: coupon.code },
      idempotencyKey: 'integration-full-coupon',
    })).rejects.toMatchObject({ statusCode: 409, code: 'COUPON_INVALID' });
    await expect(Coupon.findById(coupon._id).lean())
      .resolves.toMatchObject({ reservedCount: 1, usedCount: 0 });
    await expect(Reservation.countDocuments({ user: user._id })).resolves.toBe(0);
  });

  integrationIt('confirms a captured payment once and converts the hold into a confirmed reservation', async () => {
    const checkout = await createBooking({
      user,
      body: requestBody,
      idempotencyKey: 'integration-payment',
    });
    mockRazorpay({
      fetchPayment: async (paymentId) => ({
        id: paymentId,
        order_id: checkout.razorpayOrderId,
        amount: checkout.amount,
        status: 'captured',
        method: 'upi',
      }),
    });

    const signature = signRazorpay(checkout.razorpayOrderId, 'payment-integration');
    const result = await verifyPayment({
      userId: user._id,
      orderId: checkout.razorpayOrderId,
      paymentId: 'payment-integration',
      signature,
    });
    const duplicate = await verifyPayment({
      userId: user._id,
      orderId: checkout.razorpayOrderId,
      paymentId: 'payment-integration',
      signature,
    });

    expect(result).toMatchObject({ confirmed: true, idempotent: false });
    expect(duplicate).toMatchObject({ confirmed: true, idempotent: true });
    expect(await Booking.countDocuments({
      _id: checkout.booking._id,
      status: 'confirmed',
      'payment.status': 'captured',
    })).toBe(1);
    expect(await Reservation.countDocuments({
      booking: checkout.booking._id,
      status: 'confirmed',
    })).toBe(1);
    const confirmedUnit = await InventoryUnit.findById(unit._id).lean();
    expect(confirmedUnit.status).toBe('reserved');
    expect(confirmedUnit.rentCount).toBe(1);
  });

  integrationIt('captures an authorized payment before confirming the booking', async () => {
    const checkout = await createBooking({
      user,
      body: requestBody,
      idempotencyKey: 'integration-authorized-payment',
    });
    const capture = jest.fn(async (paymentId, amount, currency) => ({
      id: paymentId,
      order_id: checkout.razorpayOrderId,
      amount,
      currency,
      status: 'captured',
      method: 'card',
    }));
    mockRazorpay({
      fetchPayment: async (paymentId) => ({
        id: paymentId,
        order_id: checkout.razorpayOrderId,
        amount: checkout.amount,
        status: 'authorized',
      }),
      capturePayment: capture,
    });

    await expect(verifyPayment({
      userId: user._id,
      orderId: checkout.razorpayOrderId,
      paymentId: 'payment-authorized',
      signature: signRazorpay(checkout.razorpayOrderId, 'payment-authorized'),
    })).resolves.toMatchObject({ confirmed: true, idempotent: false });
    expect(capture).toHaveBeenCalledWith('payment-authorized', checkout.amount, 'INR');
    await expect(Booking.countDocuments({ _id: checkout.booking._id, status: 'confirmed' })).resolves.toBe(1);
  });

  integrationIt('rejects provider amount mismatches without confirming or mutating the checkout', async () => {
    const checkout = await createBooking({
      user,
      body: requestBody,
      idempotencyKey: 'integration-payment-mismatch',
    });
    mockRazorpay({
      fetchPayment: async (paymentId) => ({
        id: paymentId,
        order_id: checkout.razorpayOrderId,
        amount: checkout.amount + 1,
        status: 'captured',
      }),
    });

    await expect(verifyPayment({
      userId: user._id,
      orderId: checkout.razorpayOrderId,
      paymentId: 'payment-wrong-amount',
      signature: signRazorpay(checkout.razorpayOrderId, 'payment-wrong-amount'),
    })).rejects.toMatchObject({ statusCode: 400, code: 'PAYMENT_MISMATCH' });
    await expect(Booking.countDocuments({ _id: checkout.booking._id, status: 'pending_payment' })).resolves.toBe(1);
    await expect(Reservation.countDocuments({ booking: checkout.booking._id, status: 'held' })).resolves.toBe(1);
  });

  integrationIt('rejects unknown payment orders and provider payments that are not captured', async () => {
    const checkout = await createBooking({
      user,
      body: requestBody,
      idempotencyKey: 'integration-payment-not-found',
    });
    const fetchPayment = jest.fn(async () => ({
      order_id: checkout.razorpayOrderId,
      amount: checkout.amount,
      status: 'failed',
    }));
    mockRazorpay({ fetchPayment });

    await expect(verifyPayment({
      userId: '000000000000000000000000',
      orderId: checkout.razorpayOrderId,
      paymentId: 'payment-foreign-user',
      signature: signRazorpay(checkout.razorpayOrderId, 'payment-foreign-user'),
    })).rejects.toMatchObject({ statusCode: 404 });
    expect(fetchPayment).not.toHaveBeenCalled();

    await expect(verifyPayment({
      userId: user._id,
      orderId: checkout.razorpayOrderId,
      paymentId: 'payment-failed-status',
      signature: signRazorpay(checkout.razorpayOrderId, 'payment-failed-status'),
    })).rejects.toMatchObject({ statusCode: 400, code: 'PAYMENT_MISMATCH' });
    await expect(Booking.countDocuments({ _id: checkout.booking._id, status: 'pending_payment' }))
      .resolves.toBe(1);
  });

  integrationIt('rejects an authorized payment when capture does not complete', async () => {
    const checkout = await createBooking({
      user,
      body: requestBody,
      idempotencyKey: 'integration-payment-capture-failure',
    });
    mockRazorpay({
      fetchPayment: async (paymentId) => ({
        id: paymentId,
        order_id: checkout.razorpayOrderId,
        amount: checkout.amount,
        status: 'authorized',
      }),
      capturePayment: async (paymentId) => ({ id: paymentId, status: 'authorized' }),
    });

    await expect(verifyPayment({
      userId: user._id,
      orderId: checkout.razorpayOrderId,
      paymentId: 'payment-capture-failure',
      signature: signRazorpay(checkout.razorpayOrderId, 'payment-capture-failure'),
    })).rejects.toMatchObject({ statusCode: 409, code: 'PAYMENT_NOT_CAPTURED' });
    await expect(Booking.countDocuments({ _id: checkout.booking._id, status: 'pending_payment' }))
      .resolves.toBe(1);
  });

  integrationIt('rolls back payment confirmation if product or unit rental counters overflow', async () => {
    const checkout = await createBooking({
      user,
      body: requestBody,
      idempotencyKey: 'integration-rent-count-overflow',
    });
    mockRazorpay({
      fetchPayment: async (paymentId) => ({
        id: paymentId,
        order_id: checkout.razorpayOrderId,
        amount: checkout.amount,
        status: 'captured',
      }),
    });

    await Product.updateOne({ _id: product._id }, { $set: { rentCount: Number.MAX_SAFE_INTEGER } });
    await expect(verifyPayment({
      userId: user._id,
      orderId: checkout.razorpayOrderId,
      paymentId: 'payment-product-overflow',
      signature: signRazorpay(checkout.razorpayOrderId, 'payment-product-overflow'),
    })).rejects.toMatchObject({ statusCode: 409 });

    await Product.updateOne({ _id: product._id }, { $set: { rentCount: 0 } });
    await InventoryUnit.updateOne({ _id: unit._id }, { $set: { rentCount: Number.MAX_SAFE_INTEGER } });
    await expect(verifyPayment({
      userId: user._id,
      orderId: checkout.razorpayOrderId,
      paymentId: 'payment-unit-overflow',
      signature: signRazorpay(checkout.razorpayOrderId, 'payment-unit-overflow'),
    })).rejects.toMatchObject({ statusCode: 409 });
    await expect(Booking.countDocuments({ _id: checkout.booking._id, status: 'pending_payment' }))
      .resolves.toBe(1);
    await expect(Payment.findOne({ booking: checkout.booking._id }).lean())
      .resolves.toMatchObject({ status: 'created' });
  });

  integrationIt('refunds a captured payment attached to a superseded order', async () => {
    const checkout = await createBooking({
      user,
      body: requestBody,
      idempotencyKey: 'integration-stale-payment-order',
    });
    mockRazorpay({
      refundPayment: async () => ({ id: 'refund-stale-order', status: 'created' }),
    });
    await Booking.updateOne(
      { _id: checkout.booking._id },
      { $set: { 'payment.razorpayOrderId': 'order_replacement' } }
    );

    const result = await confirmPayment({
      orderId: checkout.razorpayOrderId,
      paymentId: 'payment-stale-order',
      source: 'webhook',
      payment: { status: 'captured' },
      signature: 'verified-by-provider-webhook',
    });

    expect(result).toMatchObject({
      confirmed: false,
      refundPending: true,
      staleOrder: true,
    });
    await expect(Refund.findOne({ booking: checkout.booking._id }).lean())
      .resolves.toMatchObject({ reason: 'admin_goodwill', amount: checkout.amount });
    await expect(Booking.countDocuments({ _id: checkout.booking._id, status: 'confirmed' }))
      .resolves.toBe(0);
  });

  integrationIt('does not resubmit a stale-order refund that is already pending', async () => {
    const checkout = await createBooking({
      user,
      body: requestBody,
      idempotencyKey: 'integration-existing-stale-refund',
    });
    const payment = await Payment.findOne({ booking: checkout.booking._id });
    await Refund.create({
      booking: checkout.booking._id,
      payment: payment._id,
      amount: 1000,
      reason: 'admin_goodwill',
      status: 'pending',
    });
    await Booking.updateOne(
      { _id: checkout.booking._id },
      { $set: { 'payment.razorpayOrderId': 'order_replacement' } }
    );

    await expect(confirmPayment({
      orderId: checkout.razorpayOrderId,
      paymentId: 'payment-existing-stale-refund',
      source: 'webhook',
      payment: { status: 'captured' },
    })).resolves.toMatchObject({
      confirmed: false,
      refundPending: true,
      staleOrder: true,
      idempotent: true,
    });
    await expect(Refund.countDocuments({ booking: checkout.booking._id })).resolves.toBe(1);
  });

  integrationIt('expires a late captured checkout and starts an automatic failed-delivery refund', async () => {
    const checkout = await createBooking({
      user,
      body: requestBody,
      idempotencyKey: 'integration-expired-payment-hold',
    });
    mockRazorpay({
      refundPayment: async () => ({ id: 'refund-expired-hold', status: 'created' }),
    });
    await Booking.updateOne(
      { _id: checkout.booking._id },
      { $set: { holdExpiresAt: new Date(Date.now() - 60_000) } }
    );

    const result = await confirmPayment({
      orderId: checkout.razorpayOrderId,
      paymentId: 'payment-after-hold',
      source: 'webhook',
      payment: { status: 'captured' },
      signature: 'verified-by-provider-webhook',
    });

    expect(result).toMatchObject({ confirmed: false, refundPending: true, staleOrder: false });
    await expect(Booking.countDocuments({ _id: checkout.booking._id, status: 'expired' })).resolves.toBe(1);
    await expect(Reservation.countDocuments({ booking: checkout.booking._id, status: 'cancelled' }))
      .resolves.toBe(1);
    await expect(Refund.findOne({ booking: checkout.booking._id }).lean())
      .resolves.toMatchObject({ reason: 'failed_delivery', amount: checkout.amount });
  });

  integrationIt('does not create a duplicate refund for an already-expired captured hold', async () => {
    const checkout = await createBooking({
      user,
      body: requestBody,
      idempotencyKey: 'integration-existing-expired-refund',
    });
    const payment = await Payment.findOne({ booking: checkout.booking._id });
    await Refund.create({
      booking: checkout.booking._id,
      payment: payment._id,
      amount: checkout.amount,
      reason: 'failed_delivery',
      status: 'pending',
    });
    await Booking.updateOne(
      { _id: checkout.booking._id },
      { $set: { holdExpiresAt: new Date(Date.now() - 60_000) } }
    );

    await expect(confirmPayment({
      orderId: checkout.razorpayOrderId,
      paymentId: 'payment-existing-expired-refund',
      source: 'webhook',
      payment: { status: 'captured' },
    })).resolves.toMatchObject({
      confirmed: false,
      refundPending: true,
      idempotent: true,
    });
    await expect(Refund.countDocuments({ booking: checkout.booking._id })).resolves.toBe(1);
  });

  integrationIt('releases reservation holds and marks checkout failed when order creation fails', async () => {
    const coupon = await createCoupon({ code: 'PROVIDERFAIL10' });
    mockRazorpay({
      createOrder: async () => {
        throw new Error('Razorpay unavailable');
      },
    });

    await expect(createBooking({
      user,
      body: { ...requestBody, couponCode: coupon.code },
      idempotencyKey: 'integration-provider-failure',
    })).rejects.toThrow('Razorpay unavailable');

    const failedBooking = await Booking.findOne({ user: user._id }).lean();
    expect(failedBooking.status).toBe('payment_failed');
    expect(await Reservation.countDocuments({ booking: failedBooking._id, status: 'cancelled' })).toBe(1);
    expect(await Payment.countDocuments({ booking: failedBooking._id })).toBe(0);
    await expect(Coupon.findById(coupon._id).lean())
      .resolves.toMatchObject({ reservedCount: 0, usedCount: 0 });
  });

  integrationIt('replaces the pending order once and rejects a second payment retry', async () => {
    let orderNumber = 0;
    mockRazorpay({
      createOrder: async ({ amount, currency }) => ({
        id: `order_retry_${++orderNumber}`,
        amount,
        currency,
      }),
    });
    const checkout = await createBooking({
      user,
      body: requestBody,
      idempotencyKey: 'integration-payment-retry',
    });
    const retry = await retryPayment({ bookingId: checkout.booking._id, user });

    expect(retry.razorpayOrderId).toBe('order_retry_2');
    await expect(Payment.findOne({ razorpayOrderId: 'order_retry_1' }).lean())
      .resolves.toMatchObject({ status: 'failed' });
    await expect(Payment.findOne({ razorpayOrderId: 'order_retry_2' }).lean())
      .resolves.toMatchObject({ status: 'created' });
    await expect(retryPayment({ bookingId: checkout.booking._id, user }))
      .rejects.toMatchObject({ statusCode: 409, code: 'PAYMENT_RETRY_EXHAUSTED' });
    await expect(Payment.countDocuments({ booking: checkout.booking._id })).resolves.toBe(2);
  });

  integrationIt('retains the active hold and marks payment failed when a retry order cannot be created', async () => {
    let orderNumber = 0;
    mockRazorpay({
      createOrder: async ({ amount, currency }) => {
        orderNumber += 1;
        if (orderNumber === 2) throw new Error('Retry order unavailable');
        return { id: 'order_initial', amount, currency };
      },
    });
    const checkout = await createBooking({
      user,
      body: requestBody,
      idempotencyKey: 'integration-payment-retry-failure',
    });

    await expect(retryPayment({ bookingId: checkout.booking._id, user }))
      .rejects.toThrow('Retry order unavailable');

    await expect(Booking.findById(checkout.booking._id).lean())
      .resolves.toMatchObject({
        status: 'pending_payment',
        payment: { status: 'failed', retryCount: 1 },
      });
    await expect(Payment.findOne({ booking: checkout.booking._id }).lean())
      .resolves.toMatchObject({ status: 'failed' });
    await expect(Reservation.countDocuments({ booking: checkout.booking._id, status: 'held' }))
      .resolves.toBe(1);
    await expect(retryPayment({ bookingId: checkout.booking._id, user }))
      .rejects.toMatchObject({ statusCode: 409, code: 'PAYMENT_RETRY_EXHAUSTED' });
  });

  integrationIt('returns not found when a booking is read by a different customer', async () => {
    const checkout = await createBooking({
      user,
      body: requestBody,
      idempotencyKey: 'integration-booking-ownership',
    });

    await expect(getBookingById(checkout.booking._id, '000000000000000000000000'))
      .rejects.toMatchObject({ statusCode: 404 });
    await expect(getBookingById(checkout.booking._id, user._id))
      .resolves.toMatchObject({ bookingNumber: checkout.booking.bookingNumber });
  });

  integrationIt('records payment failure details and appends a retryable failure attempt', async () => {
    const checkout = await createBooking({
      user,
      body: requestBody,
      idempotencyKey: 'integration-payment-failure-event',
    });

    await processRazorpayEvent({
      event: 'payment.failed',
      payload: {
        payment: {
          entity: {
            id: 'payment-failed',
            order_id: checkout.razorpayOrderId,
            error_code: 'BAD_REQUEST_ERROR',
            error_description: 'Bank declined the payment',
          },
        },
      },
    });

    const payment = await Payment.findOne({ booking: checkout.booking._id }).lean();
    expect(payment).toMatchObject({
      status: 'failed',
      errorCode: 'BAD_REQUEST_ERROR',
      errorDescription: 'Bank declined the payment',
    });
    expect(payment.attempts).toHaveLength(1);
    await expect(Booking.countDocuments({ _id: checkout.booking._id, status: 'pending_payment' }))
      .resolves.toBe(1);
  });

  integrationIt('marks a payment authorized from a provider event without confirming early', async () => {
    const checkout = await createBooking({
      user,
      body: requestBody,
      idempotencyKey: 'integration-payment-authorized-event',
    });

    await processRazorpayEvent({
      event: 'payment.authorized',
      payload: {
        payment: {
          entity: { id: 'payment-auth-event', order_id: checkout.razorpayOrderId },
        },
      },
    });

    await expect(Payment.findOne({ booking: checkout.booking._id }).lean())
      .resolves.toMatchObject({ status: 'authorized', razorpayPaymentId: 'payment-auth-event' });
    await expect(Booking.countDocuments({ _id: checkout.booking._id, status: 'pending_payment' }))
      .resolves.toBe(1);
  });

  integrationIt('confirms a captured payment delivered through the provider event handler', async () => {
    const checkout = await createBooking({
      user,
      body: requestBody,
      idempotencyKey: 'integration-captured-payment-event',
    });

    await processRazorpayEvent({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'payment-captured-event',
            order_id: checkout.razorpayOrderId,
            status: 'captured',
            method: 'card',
          },
        },
      },
    });

    await expect(Booking.countDocuments({ _id: checkout.booking._id, status: 'confirmed' }))
      .resolves.toBe(1);
  });

  integrationIt('records failed-payment provider state without notifying for a non-pending booking', async () => {
    const checkout = await createBooking({
      user,
      body: requestBody,
      idempotencyKey: 'integration-late-payment-failure',
    });
    await Booking.updateOne({ _id: checkout.booking._id }, { $set: { status: 'confirmed' } });

    await processRazorpayEvent({
      event: 'payment.failed',
      payload: {
        payment: {
          entity: {
            id: 'payment-failed-after-confirmation',
            order_id: checkout.razorpayOrderId,
            error_code: 'PAYMENT_ERROR',
          },
        },
      },
    });

    await expect(Payment.findOne({ booking: checkout.booking._id }).lean())
      .resolves.toMatchObject({ status: 'failed', errorCode: 'PAYMENT_ERROR' });
    await expect(Booking.countDocuments({ _id: checkout.booking._id, status: 'confirmed' }))
      .resolves.toBe(1);
  });

  integrationIt('persists valid webhooks and acknowledges duplicate event IDs idempotently', async () => {
    const body = { event: 'unhandled.integration.event', payload: {} };
    const { rawBody, signature } = signWebhook(body);
    const first = await acceptRazorpayWebhook({
      rawBody,
      signature,
      eventId: 'integration-webhook-event',
    });
    const duplicate = await acceptRazorpayWebhook({
      rawBody,
      signature,
      eventId: 'integration-webhook-event',
    });

    expect(first).toEqual({ accepted: true, duplicate: false });
    expect(duplicate).toEqual({ accepted: true, duplicate: true });

    let stored;
    for (let attempt = 0; attempt < 20; attempt += 1) {
      stored = await WebhookEvent.findOne({ eventId: 'integration-webhook-event' })
        .select('+payload')
        .lean();
      if (stored?.status === 'processed') break;
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    expect(stored).toMatchObject({
      event: body.event,
      status: 'processed',
      payload: { event: body.event },
    });
  });

  integrationIt('rejects malformed, unsigned, or nameless provider webhooks', async () => {
    await expect(acceptRazorpayWebhook({}))
      .rejects.toMatchObject({ statusCode: 400 });

    const rawBody = Buffer.from('{');
    const signedMalformed = signWebhook(rawBody);
    await expect(acceptRazorpayWebhook({
      ...signedMalformed,
      eventId: 'integration-malformed-webhook',
    })).rejects.toMatchObject({ statusCode: 400 });

    const missingEvent = signWebhook({ payload: {} });
    await expect(acceptRazorpayWebhook({
      ...missingEvent,
      eventId: 'integration-missing-webhook-event',
    })).rejects.toMatchObject({ statusCode: 400 });

    const validBody = signWebhook({ event: 'unhandled.integration.event' });
    await expect(acceptRazorpayWebhook({
      rawBody: validBody.rawBody,
      signature: '0'.repeat(64),
      eventId: 'integration-invalid-webhook-signature',
    })).rejects.toMatchObject({ statusCode: 400, code: 'INVALID_WEBHOOK_SIGNATURE' });
  });

  integrationIt('propagates unexpected webhook persistence errors', async () => {
    const signed = signWebhook({ event: 'unhandled.integration.event' });
    const create = jest.spyOn(WebhookEvent, 'create').mockRejectedValue(new Error('Database write failed'));
    try {
      await expect(acceptRazorpayWebhook({
        ...signed,
        eventId: 'integration-webhook-database-error',
      })).rejects.toThrow('Database write failed');
    } finally {
      create.mockRestore();
    }
  });

  integrationIt('keeps the refund record when a refund submission query fails unexpectedly', async () => {
    const { booking, payment } = await createCapturedCheckout(
      'integration-refund-submit-query-error',
      'payment-refund-submit-query-error'
    );
    const findOneAndUpdate = jest.spyOn(Refund, 'findOneAndUpdate')
      .mockImplementation(() => {
        throw new Error('Refund submission query failed');
      });
    let refund;
    try {
      refund = await createRefund({
        booking,
        payment,
        amount: 500,
        reason: 'admin_goodwill',
      });
    } finally {
      findOneAndUpdate.mockRestore();
    }
    await expect(Refund.findById(refund._id).lean()).resolves.toMatchObject({ status: 'pending' });
  });

  integrationIt('marks webhook processing failures for retry and diagnostics', async () => {
    const body = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: { id: 'payment-no-local-order', order_id: 'order-does-not-exist' },
        },
      },
    };
    const signed = signWebhook(body);
    await expect(acceptRazorpayWebhook({
      ...signed,
      eventId: 'integration-failing-webhook',
    })).rejects.toMatchObject({
      statusCode: 503,
      code: 'WEBHOOK_PROCESSING_PENDING',
    });

    let stored;
    for (let attempt = 0; attempt < 20; attempt += 1) {
      stored = await WebhookEvent.findOne({ eventId: 'integration-failing-webhook' }).lean();
      if (stored?.status === 'failed') break;
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    expect(stored.status).toBe('failed');
    expect(stored.error).toBe('Webhook processing failed');
  });

  integrationIt('acknowledges webhook events after the retry limit for manual reconciliation', async () => {
    const body = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: { id: 'payment-exhausted-order', order_id: 'order-does-not-exist' },
        },
      },
    };
    const signed = signWebhook(body);
    await WebhookEvent.create({
      eventId: 'integration-exhausted-webhook',
      event: body.event,
      payload: body,
      status: 'failed',
      attempts: 12,
      nextAttemptAt: new Date(Date.now() - 1_000),
    });

    await expect(acceptRazorpayWebhook({
      ...signed,
      eventId: 'integration-exhausted-webhook',
    })).resolves.toEqual({ accepted: true, duplicate: true });
    await expect(WebhookEvent.findOne({ eventId: 'integration-exhausted-webhook' }).lean())
      .resolves.toMatchObject({ status: 'failed', attempts: 12 });
  });

  integrationIt('reserves refund balance and updates it when a processed refund event arrives', async () => {
    const { booking, payment } = await createCapturedCheckout(
      'integration-refund-lifecycle',
      'payment-refund-lifecycle'
    );
    mockRazorpay({
      refundPayment: async () => ({ id: 'refund-integration', status: 'created' }),
    });
    const createdRefund = await createRefund({
      booking,
      payment,
      amount: 1000,
      reason: 'admin_goodwill',
      notes: 'Integration-test refund',
    });
    const refund = await Refund.findById(createdRefund._id);

    expect(refund.razorpayRefundId).toBe('refund-integration');
    await expect(Payment.findById(payment._id).lean())
      .resolves.toMatchObject({ refundReservedAmount: 1000, refundedAmount: 0 });

    await processRazorpayEvent({
      event: 'refund.processed',
      payload: {
        refund: {
          entity: { id: 'refund-integration', created_at: Math.floor(Date.now() / 1000) },
        },
      },
    });

    await expect(Refund.findById(refund._id).lean()).resolves.toMatchObject({ status: 'processed' });
    await expect(Payment.findById(payment._id).lean())
      .resolves.toMatchObject({
        refundReservedAmount: 0,
        refundedAmount: 1000,
        status: 'partially_refunded',
      });
    await expect(Booking.findById(booking._id).lean())
      .resolves.toMatchObject({ payment: { status: 'partially_refunded' } });
    await expect(createRefundRecord({
      booking,
      payment,
      amount: 0,
      reason: 'admin_goodwill',
    })).rejects.toMatchObject({ statusCode: 400 });
    await expect(createRefundRecord({
      booking,
      payment: await Payment.findById(payment._id),
      amount: payment.amount + 1,
      reason: 'admin_goodwill',
    })).rejects.toMatchObject({ statusCode: 400 });
    await expect(submitRefund('000000000000000000000000')).resolves.toBeNull();
  });

  integrationIt('retries failed refund submissions and marks the fifth failure for escalation', async () => {
    const { booking, payment } = await createCapturedCheckout(
      'integration-refund-failure',
      'payment-refund-failure'
    );
    mockRazorpay({
      refundPayment: async () => {
        throw new Error('Razorpay refund endpoint unavailable');
      },
    });
    const createdRefund = await createRefund({
      booking,
      payment,
      amount: 1000,
      reason: 'admin_goodwill',
      notes: 'Retry the failed refund',
    });
    let refund = await Refund.findById(createdRefund._id);
    expect(refund.submissionAttempts).toBe(1);
    expect(refund.lastError).toContain('endpoint unavailable');

    for (let attempt = 2; attempt <= 5; attempt += 1) {
      refund.lastAttemptAt = new Date(Date.now() - 11 * 60_000);
      await refund.save();
      await submitRefund(refund._id);
      refund = await Refund.findById(refund._id);
      expect(refund.submissionAttempts).toBe(attempt);
    }

    expect(refund.escalatedAt).toBeInstanceOf(Date);
    expect(refund.status).toBe('pending');
    await expect(Payment.findById(payment._id).lean())
      .resolves.toMatchObject({ refundReservedAmount: 1000, refundedAmount: 0 });
  });

  integrationIt('releases reserved refund balance when the provider reports a failed refund', async () => {
    const { booking, payment } = await createCapturedCheckout(
      'integration-refund-failed-event',
      'payment-refund-failed-event'
    );
    mockRazorpay({
      refundPayment: async () => ({ id: 'refund-failed-event', status: 'created' }),
    });
    const refundResult = await createRefund({
      booking,
      payment,
      amount: 1500,
      reason: 'admin_goodwill',
    });
    const refund = await Refund.findById(refundResult._id);

    await processRazorpayEvent({
      event: 'refund.failed',
      payload: { refund: { entity: { id: refund.razorpayRefundId } } },
    });

    await expect(Refund.findById(refund._id).lean()).resolves.toMatchObject({ status: 'failed' });
    await expect(Payment.findById(payment._id).lean())
      .resolves.toMatchObject({ refundReservedAmount: 0, refundedAmount: 0 });
  });

  integrationIt('defers refund submission when its caller supplies an active transaction', async () => {
    const { booking, payment } = await createCapturedCheckout(
      'integration-transactional-refund',
      'payment-transactional-refund'
    );
    const razorpay = mockRazorpay();
    let refund;
    await withTransaction(async (session) => {
      refund = await createRefund({
        booking,
        payment,
        amount: 2000,
        reason: 'admin_goodwill',
        session,
      });
    });

    expect(refund.status).toBe('pending');
    expect(razorpay.payments.refund).not.toHaveBeenCalled();
    await expect(Payment.findById(payment._id).lean())
      .resolves.toMatchObject({ refundReservedAmount: 2000, refundedAmount: 0 });
  });
});
