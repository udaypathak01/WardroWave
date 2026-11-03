import { beforeEach, describe, expect, it } from '@jest/globals';
import { AuditLog } from '../../src/models/AuditLog.js';
import { Booking } from '../../src/models/Booking.js';
import { InventoryUnit } from '../../src/models/InventoryUnit.js';
import { Payment } from '../../src/models/Payment.js';
import { Product } from '../../src/models/Product.js';
import { Refund } from '../../src/models/Refund.js';
import { ServiceablePincode } from '../../src/models/ServiceablePincode.js';
import { buildBookingInvoice } from '../../src/services/invoice.service.js';
import {
  deliverBooking,
  dispatchBooking,
  receiveReturn,
  requestReturn,
} from '../../src/services/fulfillment.service.js';
import { cancelBooking } from '../../src/services/cancellation.service.js';
import { inspectReturn, markUnitClean } from '../../src/services/returnInspection.service.js';
import {
  readAdminSettings,
  updateAdminSettings,
  updateServiceablePincode,
} from '../../src/services/adminSettings.service.js';
import { getOperationsReport } from '../../src/services/report.service.js';
import { formatRentalDate } from '../../src/utils/dates.js';
import { createBooking, createProductWithUnits, createUser } from '../helpers/factories.js';
import { mockRazorpay } from '../helpers/providerMocks.js';

const enabled = process.env.RUN_MONGO_INTEGRATION === 'true';
const integrationIt = enabled ? it : it.skip;
let customer;
let staff;
let product;
let variant;
let unit;

beforeEach(async () => {
  if (!enabled) return;
  customer = await createUser();
  staff = await createUser({ role: 'staff' });
  ({ product, variant, units: [unit] } = await createProductWithUnits());
});

describe('operations service integration', () => {
  integrationIt('cancels unpaid and paid bookings idempotently and reverses captured inventory', async () => {
    mockRazorpay();
    const pending = await createBooking({ user: customer, product, variant, unit });
    await expect(cancelBooking({
      bookingId: pending._id,
      userId: customer._id,
      reason: 'Changed plans',
    })).resolves.toMatchObject({
      idempotent: false,
      refundId: null,
      booking: { status: 'cancelled' },
    });
    await expect(cancelBooking({
      bookingId: pending._id,
      userId: customer._id,
      reason: 'Changed plans',
    })).resolves.toMatchObject({ idempotent: true, refundId: null });
    await expect(cancelBooking({
      bookingId: pending._id,
      userId: staff._id,
      reason: 'Not the owner',
    })).rejects.toMatchObject({ statusCode: 404 });

    const paid = await createBooking({
      user: customer,
      product,
      variant,
      unit,
      status: 'confirmed',
    });
    await Booking.updateOne({ _id: paid._id }, { $set: { 'payment.status': 'captured' } });
    await Payment.create({
      booking: paid._id,
      user: customer._id,
      razorpayOrderId: `order-${paid._id}`,
      amount: paid.pricing.grandTotal,
      status: 'captured',
      paidAt: new Date(),
    });
    await Product.updateOne({ _id: product._id }, { $set: { rentCount: 1 } });
    await InventoryUnit.updateOne(
      { _id: unit._id },
      { $set: { rentCount: 1, status: 'reserved' } }
    );

    const result = await cancelBooking({
      bookingId: paid._id,
      userId: customer._id,
      reason: 'Customer request',
    });
    expect(result.booking.status).toBe('cancelled');
    expect(result.refundId).toBeTruthy();
    await expect(Refund.findById(result.refundId).lean()).resolves.toMatchObject({
      reason: 'cancellation',
      status: 'pending',
      razorpayRefundId: 'refund_test',
    });
    await expect(Product.findById(product._id).lean()).resolves.toMatchObject({ rentCount: 0 });
    await expect(InventoryUnit.findById(unit._id).lean()).resolves.toMatchObject({
      rentCount: 0,
      status: 'available',
    });
  });

  integrationIt('dispatches, delivers, receives, inspects, and cleans a rental return', async () => {
    mockRazorpay();
    const booking = await createBooking({
      user: customer,
      product,
      variant,
      unit,
      status: 'confirmed',
      'payment.status': 'captured',
      'payment.razorpayOrderId': 'order-operations-test',
      invoiceNumber: 'WW-INV-OPERATIONS',
    });
    await Booking.updateOne(
      { _id: booking._id },
      { $set: { 'payment.status': 'captured', 'payment.razorpayOrderId': 'order-operations-test' } }
    );
    await Payment.create({
      booking: booking._id,
      user: customer._id,
      razorpayOrderId: 'order-operations-test',
      razorpayPaymentId: 'payment-operations-test',
      amount: booking.pricing.grandTotal,
      status: 'captured',
      paidAt: new Date(),
    });
    const requestContext = { ip: '127.0.0.1', userAgent: 'integration-test' };

    await expect(dispatchBooking({
      bookingId: booking._id,
      actor: staff,
      carrier: 'Test Courier',
      trackingNumber: 'TRACK-001',
      request: requestContext,
    })).resolves.toMatchObject({
      status: 'dispatched',
      logistics: { outboundCarrier: 'Test Courier', outboundTracking: 'TRACK-001' },
    });
    await expect(deliverBooking({
      bookingId: booking._id,
      actor: staff,
      request: requestContext,
    })).resolves.toMatchObject({ status: 'delivered' });
    await expect(requestReturn({
      bookingId: booking._id,
      userId: customer._id,
      pickupAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    })).resolves.toMatchObject({ status: 'return_requested' });
    await expect(receiveReturn({
      bookingId: booking._id,
      actor: staff,
      carrier: 'Reverse Courier',
      trackingNumber: 'RETURN-001',
      request: requestContext,
    })).resolves.toMatchObject({ status: 'returned' });

    const inspected = await inspectReturn({
      bookingId: booking._id,
      actor: staff,
      items: [{ itemId: booking.items[0]._id, damageLevel: 'none', damageCharge: 0 }],
      request: requestContext,
    });
    expect(inspected.booking.status).toBe('completed');
    expect(inspected.booking.settlement.depositRefunded).toBe(product.pricing.securityDeposit);
    expect(inspected.refundId).toBeTruthy();
    await expect(Refund.findById(inspected.refundId).lean()).resolves.toMatchObject({
      reason: 'deposit_return',
      amount: product.pricing.securityDeposit,
    });
    await expect(InventoryUnit.findById(unit._id).lean()).resolves.toMatchObject({ status: 'cleaning' });

    await expect(markUnitClean({
      unitId: unit._id,
      actor: staff,
      request: requestContext,
    })).resolves.toMatchObject({ status: 'available' });
    await expect(AuditLog.countDocuments({ entityType: 'Booking', entityId: booking._id }))
      .resolves.toBe(4);

    const invoice = await buildBookingInvoice(booking._id, customer._id);
    expect(invoice.subarray(0, 4).toString()).toBe('%PDF');
    await expect(buildBookingInvoice(booking._id, staff._id))
      .rejects.toMatchObject({ statusCode: 404 });
  });

  integrationIt('rejects invalid fulfillment transitions and return assessments', async () => {
    const booking = await createBooking({ user: customer, product, variant, unit });
    const requestContext = { ip: '127.0.0.1', userAgent: 'integration-test' };
    await expect(dispatchBooking({
      bookingId: booking._id,
      actor: staff,
      carrier: 'Test Courier',
      trackingNumber: 'TRACK-002',
      request: requestContext,
    })).rejects.toMatchObject({ statusCode: 409 });
    await expect(requestReturn({
      bookingId: booking._id,
      userId: customer._id,
      pickupAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    })).rejects.toMatchObject({ statusCode: 409 });
    await expect(inspectReturn({
      bookingId: booking._id,
      actor: staff,
      items: [],
      request: requestContext,
    })).rejects.toMatchObject({ statusCode: 409 });
    await expect(buildBookingInvoice(booking._id, customer._id))
      .rejects.toMatchObject({ statusCode: 409 });
  });

  integrationIt('updates runtime settings, serviceable pincodes, and validates report ranges', async () => {
    const actor = await createUser({ role: 'admin' });
    const requestContext = { ip: '127.0.0.1', userAgent: 'integration-test' };
    const initial = await readAdminSettings();
    const updated = await updateAdminSettings({
      input: { deliveryFee: 2_500 },
      actor,
      request: requestContext,
    });
    expect(updated.deliveryFee).toBe(2_500);
    expect(updated.minRentalDays).toBe(initial.minRentalDays);
    await expect(updateAdminSettings({
      input: { minRentalDays: 10, maxRentalDays: 3 },
      actor,
      request: requestContext,
    })).rejects.toMatchObject({ statusCode: 400 });

    await expect(updateServiceablePincode({
      pincode: '411001',
      input: { city: 'Pune', state: 'Maharashtra', deliveryDays: 2, isActive: true },
      actor,
      request: requestContext,
    })).resolves.toMatchObject({ pincode: '411001', city: 'Pune' });
    await expect(ServiceablePincode.countDocuments({ pincode: '411001' })).resolves.toBe(1);

    const today = formatRentalDate(new Date());
    const report = await getOperationsReport({ from: today, to: today });
    expect(report).toMatchObject({
      period: { from: today, to: today },
      payments: { capturedCount: 0, capturedAmount: 0, refundedAmount: 0, netAmount: 0 },
    });
    await expect(getOperationsReport({ from: today, to: 'invalid' }))
      .rejects.toMatchObject({ statusCode: 400 });
  });
});
