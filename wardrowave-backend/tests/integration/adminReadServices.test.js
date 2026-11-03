import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import admin from '../../src/config/firebase.js';
import { AuditLog } from '../../src/models/AuditLog.js';
import { Coupon } from '../../src/models/Coupon.js';
import { Payment } from '../../src/models/Payment.js';
import { Review } from '../../src/models/Review.js';
import { User } from '../../src/models/User.js';
import { changeUserAccess } from '../../src/services/user.service.js';
import { createBooking, createProductWithUnits, createUser, authHeader } from '../helpers/factories.js';
import { mockFirebaseAuth, mockRazorpay } from '../helpers/providerMocks.js';

const enabled = process.env.RUN_MONGO_INTEGRATION === 'true';
const integrationIt = enabled ? it : it.skip;
const app = createApp();
let adminUser;
let customer;
let fixture;
let booking;
let payment;
let coupon;
let review;

beforeEach(async () => {
  if (!enabled) return;
  adminUser = await createUser({ role: 'admin' });
  customer = await createUser();
  fixture = await createProductWithUnits();
  booking = await createBooking({
    user: customer,
    product: fixture.product,
    variant: fixture.variant,
    unit: fixture.units[0],
  });
  payment = await Payment.create({
    booking: booking._id,
    user: customer._id,
    razorpayOrderId: `order-${booking._id}`,
    razorpayPaymentId: `payment-${booking._id}`,
    amount: booking.pricing.grandTotal,
    status: 'captured',
    paidAt: new Date(),
  });
  coupon = await Coupon.create({
    code: 'ADMINREAD',
    type: 'flat',
    value: 500,
    startsAt: new Date(Date.now() - 86_400_000),
    expiresAt: new Date(Date.now() + 86_400_000),
    minRentalSubtotal: 0,
    applicableCategories: [],
    applicableProducts: [],
  });
  review = await Review.create({
    booking: booking._id,
    user: customer._id,
    product: fixture.product._id,
    rating: 5,
    title: 'Excellent fit',
    comment: 'A helpful review for the admin queue.',
  });
  await AuditLog.create({
    actor: adminUser._id,
    actorRole: 'admin',
    action: 'test.admin_read',
    entityType: 'Booking',
    entityId: booking._id,
    summary: { source: 'integration' },
    requestId: 'admin-read-test',
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('admin read routes', () => {
  integrationIt('returns paginated, role-protected admin data across panel sections', async () => {
    mockFirebaseAuth(async (token) => ({ uid: token, email_verified: true }));
    const authorization = authHeader(adminUser);

    await expect(request(app).get('/api/v1/admin/dashboard').set(authorization))
      .resolves.toMatchObject({
        status: 200,
        body: { success: true, data: { bookings: { total: 1 }, pendingReviews: 1 } },
      });

    const bookingList = await request(app)
      .get(`/api/v1/admin/bookings?q=${booking.bookingNumber}`)
      .set(authorization);
    expect(bookingList).toMatchObject({
      status: 200,
      body: { data: [{ bookingNumber: booking.bookingNumber, user: { email: customer.email } }] },
    });
    await expect(request(app)
      .get(`/api/v1/admin/bookings/${booking._id}`)
      .set(authorization))
      .resolves.toMatchObject({ status: 200, body: { data: { _id: String(booking._id) } } });

    await expect(request(app)
      .get(`/api/v1/admin/customers?q=${encodeURIComponent(customer.email)}`)
      .set(authorization))
      .resolves.toMatchObject({ status: 200, body: { data: [{ _id: String(customer._id) }] } });
    await expect(request(app)
      .get(`/api/v1/admin/customers/${customer._id}`)
      .set(authorization))
      .resolves.toMatchObject({ status: 200, body: { data: { bookingCount: 1 } } });

    await expect(request(app)
      .get('/api/v1/admin/products?status=published')
      .set(authorization))
      .resolves.toMatchObject({ status: 200, body: { data: [{ _id: String(fixture.product._id) }] } });
    await expect(request(app)
      .get(`/api/v1/admin/products/${fixture.product._id}`)
      .set(authorization))
      .resolves.toMatchObject({ status: 200, body: { data: { variants: [{ _id: String(fixture.variant._id) }] } } });
    await expect(request(app)
      .get('/api/v1/admin/categories?isActive=true')
      .set(authorization))
      .resolves.toMatchObject({ status: 200, body: { data: [{ _id: String(fixture.category._id) }] } });
    await expect(request(app)
      .get('/api/v1/admin/inventory?status=available')
      .set(authorization))
      .resolves.toMatchObject({ status: 200, body: { data: [{ _id: String(fixture.units[0]._id) }] } });
    await expect(request(app)
      .get(`/api/v1/admin/payments?q=${booking.bookingNumber}`)
      .set(authorization))
      .resolves.toMatchObject({
        status: 200,
        body: { data: [{ _id: String(payment._id), refundableAmount: payment.amount, user: { email: customer.email } }] },
      });
    await expect(request(app)
      .get('/api/v1/admin/coupons?q=ADMINREAD')
      .set(authorization))
      .resolves.toMatchObject({ status: 200, body: { data: [{ _id: String(coupon._id) }] } });
    await expect(request(app)
      .get('/api/v1/admin/coupons/' + coupon._id)
      .set(authorization))
      .resolves.toMatchObject({ status: 200, body: { data: { _id: String(coupon._id) } } });
    await expect(request(app)
      .get('/api/v1/admin/reviews')
      .set(authorization))
      .resolves.toMatchObject({ status: 200, body: { data: [{ _id: String(review._id) }] } });
    await expect(request(app)
      .get('/api/v1/admin/audit-logs?action=test.admin_read')
      .set(authorization))
      .resolves.toMatchObject({
        status: 200,
        body: { data: [{ _id: expect.any(String), requestId: 'admin-read-test' }] },
      });

    const categoryResponse = await request(app)
      .post('/api/v1/admin/categories')
      .set(authorization)
      .send({ name: 'Request Correlated Category' });
    expect(categoryResponse.status).toBe(201);
    await expect(AuditLog.findOne({
      entityId: categoryResponse.body.data._id,
      action: 'category.created',
    }).lean().exec()).resolves.toMatchObject({ requestId: categoryResponse.headers['x-request-id'] });
  });

  integrationIt('rejects non-admin and unverified administrator tokens', async () => {
    const customerToken = authHeader(customer);
    const firebaseMock = mockFirebaseAuth(async (token) => ({ uid: token, email_verified: true }));
    await expect(request(app).get('/api/v1/admin/dashboard').set(customerToken))
      .resolves.toMatchObject({ status: 403 });

    const adminToken = authHeader(adminUser);
    firebaseMock.verifyIdToken.mockImplementation(async (token) => ({ uid: token, email_verified: false }));
    await expect(request(app).get('/api/v1/admin/dashboard').set(adminToken))
      .resolves.toMatchObject({ status: 403 });
  });

  integrationIt('preserves active administrator access and reserves role changes for superadmins', async () => {
    const firebaseMocks = mockFirebaseAuth(async (token) => ({
      uid: token,
      email_verified: true,
      auth_time: Math.floor(Date.now() / 1000),
    }));
    await expect(request(app)
      .patch(`/api/v1/admin/users/${adminUser._id}/access`)
      .set(authHeader(adminUser))
      .send({ status: 'blocked' }))
      .resolves.toMatchObject({ status: 403 });
    const secondAdmin = await createUser({ role: 'admin' });
    const superadmin = await createUser({ role: 'superadmin' });
    await expect(changeUserAccess({
      targetUserId: superadmin._id,
      actor: superadmin,
      status: 'blocked',
    })).rejects.toMatchObject({ statusCode: 409 });
    await expect(request(app)
      .patch(`/api/v1/admin/users/${adminUser._id}/access`)
      .set(authHeader(secondAdmin))
      .send({ role: 'staff' }))
      .resolves.toMatchObject({ status: 403 });

    const unverifiedUser = await createUser({ emailVerified: false });
    await expect(request(app)
      .patch(`/api/v1/admin/users/${unverifiedUser._id}/access`)
      .set(authHeader(superadmin))
      .send({ role: 'admin' }))
      .resolves.toMatchObject({ status: 409 });

    await expect(request(app)
      .patch(`/api/v1/admin/users/${adminUser._id}/access`)
      .set(authHeader(superadmin))
      .send({ role: 'staff' }))
      .resolves.toMatchObject({ status: 200, body: { data: { role: 'staff' } } });
    await expect(request(app)
      .get('/api/v1/admin/dashboard')
      .set(authHeader(adminUser)))
      .resolves.toMatchObject({ status: 403 });
    expect(firebaseMocks.revokeRefreshTokens).toHaveBeenCalledWith(adminUser.firebaseUid);
  });

  integrationIt('requires recent authentication and audits administrator refunds', async () => {
    mockRazorpay({ refundPayment: async () => ({ id: 'refund_admin_test', status: 'created' }) });
    const expiredAuth = mockFirebaseAuth(async (token) => ({
      uid: token,
      email_verified: true,
      auth_time: Math.floor(Date.now() / 1000) - 600,
    }));
    const route = `/api/v1/admin/payments/${payment._id}/refunds`;
    await expect(request(app)
      .post(route)
      .set(authHeader(adminUser))
      .send({ amount: 500, notes: 'Goodwill refund requested by support' }))
      .resolves.toMatchObject({
        status: 401,
        body: { error: { code: 'REAUTH_REQUIRED' } },
      });
    await expect(Payment.findById(payment._id).lean().exec())
      .resolves.toMatchObject({ refundReservedAmount: 0 });

    expiredAuth.verifyIdToken.mockImplementation(async (token) => ({
      uid: token,
      email_verified: true,
      auth_time: Math.floor(Date.now() / 1000),
    }));
    const response = await request(app)
      .post(route)
      .set(authHeader(adminUser))
      .send({ amount: 500, notes: 'Goodwill refund requested by support' });
    expect(response).toMatchObject({
      status: 200,
      body: { success: true, data: { refund: { amount: 500, status: 'pending', razorpayRefundId: 'refund_admin_test' } } },
    });
    await expect(AuditLog.findOne({
      action: 'payment.admin_refund_initiated',
      entityId: payment._id,
    }).lean().exec()).resolves.toMatchObject({
      actor: adminUser._id,
      requestId: response.headers['x-request-id'],
      summary: { amount: 500, reason: 'admin_goodwill' },
    });
  });

  integrationIt('requires recent authentication for deletion and rejects administrator deletion', async () => {
    const firebaseMock = mockFirebaseAuth(async (token) => ({
      uid: token,
      email_verified: true,
      auth_time: Math.floor(Date.now() / 1000) - 600,
    }));
    await expect(request(app)
      .delete(`/api/v1/admin/users/${customer._id}`)
      .set(authHeader(adminUser)))
      .resolves.toMatchObject({
        status: 401,
        body: { error: { code: 'REAUTH_REQUIRED' } },
      });
    firebaseMock.verifyIdToken.mockImplementation(async (token) => ({
      uid: token,
      email_verified: true,
      auth_time: Math.floor(Date.now() / 1000),
    }));
    await expect(request(app)
      .delete(`/api/v1/admin/users/${adminUser._id}`)
      .set(authHeader(adminUser)))
      .resolves.toMatchObject({
        status: 409,
        body: { error: { message: 'Administrator and staff accounts must be disabled through access management' } },
      });
  });

  integrationIt('anonymizes eligible customer accounts and audits the deletion', async () => {
    mockFirebaseAuth(async (token) => ({
      uid: token,
      email_verified: true,
      auth_time: Math.floor(Date.now() / 1000),
    }));
    const deleteFirebaseUser = jest.spyOn(admin.auth(), 'deleteUser').mockResolvedValue();
    booking.status = 'completed';
    await booking.save();

    const response = await request(app)
      .delete(`/api/v1/admin/users/${customer._id}`)
      .set(authHeader(adminUser));

    expect(response).toMatchObject({ status: 200, body: { success: true, data: { deleted: true } } });
    expect(deleteFirebaseUser).toHaveBeenCalledWith(customer.firebaseUid);
    await expect(User.findById(customer._id).lean().exec())
      .resolves.toMatchObject({
        status: 'blocked',
        name: 'Deleted User',
        deletedAt: expect.any(Date),
      });
    await expect(AuditLog.findOne({
      action: 'user.account_deleted',
      entityId: customer._id,
    }).lean().exec()).resolves.toMatchObject({
      requestId: response.headers['x-request-id'],
      summary: { anonymized: true },
    });
  });
});
