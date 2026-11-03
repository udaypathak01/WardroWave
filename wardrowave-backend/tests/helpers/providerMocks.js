import { jest } from '@jest/globals';
import { Writable } from 'node:stream';
import nodemailer from 'nodemailer';
import { v2 as cloudinary } from 'cloudinary';
import admin from '../../src/config/firebase.js';
import { getRazorpay } from '../../src/config/razorpay.js';

/**
 * Replaces Firebase token verification and admin-claim updates for integration tests.
 */
export function mockFirebaseAuth(resolveClaims = async (token) => ({ uid: token })) {
  const auth = admin.auth();
  const verifyIdToken = jest.spyOn(auth, 'verifyIdToken').mockImplementation(resolveClaims);
  const setCustomUserClaims = jest.spyOn(auth, 'setCustomUserClaims').mockResolvedValue();
  const revokeRefreshTokens = jest.spyOn(auth, 'revokeRefreshTokens').mockResolvedValue();
  return { verifyIdToken, setCustomUserClaims, revokeRefreshTokens };
}

/**
 * Replaces Razorpay order, payment, and refund operations with controllable Jest mocks.
 */
export function mockRazorpay({
  createOrder = async ({ amount, currency }) => ({ id: 'order_test', amount, currency }),
  fetchPayment = async () => ({ status: 'captured' }),
  capturePayment = async (id) => ({ id, status: 'captured' }),
  refundPayment = async () => ({ id: 'refund_test', status: 'created' }),
} = {}) {
  const razorpay = getRazorpay();
  razorpay.orders.create = jest.fn(createOrder);
  razorpay.orders.fetchPayments = jest.fn(async () => ({ items: [] }));
  razorpay.orders.fetch = jest.fn(async (id) => ({ id }));
  razorpay.payments.fetch = jest.fn(fetchPayment);
  razorpay.payments.capture = jest.fn(capturePayment);
  razorpay.payments.refund = jest.fn(refundPayment);
  return razorpay;
}

/**
 * Replaces Nodemailer's SMTP transport with an in-memory sendMail mock.
 */
export function mockNodemailer() {
  const transport = { sendMail: jest.fn().mockResolvedValue({ messageId: 'email_test' }) };
  const createTransport = jest.spyOn(nodemailer, 'createTransport').mockReturnValue(transport);
  return { transport, createTransport };
}

/**
 * Replaces Cloudinary upload and deletion calls so tests cannot contact the provider.
 */
export function mockCloudinary({
  uploadResult = {
    secure_url: 'https://images.example.test/test.jpg',
    public_id: 'wardrowave/test-image',
    width: 600,
    height: 800,
  },
} = {}) {
  const uploadStream = jest.spyOn(cloudinary.uploader, 'upload_stream')
    .mockImplementation((options, callback) => {
      return new Writable({
        write(chunk, encoding, done) { done(); },
        final(done) {
          callback(null, uploadResult);
          done();
        },
      });
    });
  const destroy = jest.spyOn(cloudinary.uploader, 'destroy')
    .mockResolvedValue({ result: 'ok' });
  return { uploadStream, destroy };
}
