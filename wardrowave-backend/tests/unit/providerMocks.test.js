import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { env } from '../../src/config/env.js';
import { sendEmail } from '../../src/services/email.service.js';
import { uploadBuffer } from '../../src/services/upload.service.js';
import {
  mockCloudinary,
  mockNodemailer,
  mockRazorpay,
} from '../helpers/providerMocks.js';

const originalEnv = {};

beforeEach(() => {
  for (const key of ['SMTP_HOST', 'MAIL_FROM', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']) {
    originalEnv[key] = env[key];
  }
});

afterEach(() => {
  for (const [key, value] of Object.entries(originalEnv)) env[key] = value;
  jest.restoreAllMocks();
});

describe('external-provider test doubles', () => {
  it('mocks Razorpay order, payment, and refund operations', async () => {
    const razorpay = mockRazorpay();
    await expect(razorpay.orders.create({ amount: 100, currency: 'INR' })).resolves.toMatchObject({
      id: 'order_test',
      amount: 100,
      currency: 'INR',
    });
    await expect(razorpay.payments.fetch('payment_test')).resolves.toMatchObject({ status: 'captured' });
    await expect(razorpay.payments.refund('payment_test')).resolves.toMatchObject({ status: 'created' });
  });

  it('mocks SMTP delivery without opening a network connection', async () => {
    env.SMTP_HOST = 'smtp.example.test';
    env.MAIL_FROM = 'test@wardrowave.example';
    const { transport, createTransport } = mockNodemailer();

    await sendEmail({
      to: 'renter@example.test',
      subject: 'Test message',
      text: 'Hello',
      template: 'welcome',
      context: { name: 'Test Renter' },
    });

    expect(createTransport).toHaveBeenCalledTimes(1);
    expect(transport.sendMail).toHaveBeenCalledWith(expect.objectContaining({
      from: env.MAIL_FROM,
      to: 'renter@example.test',
      subject: 'Test message',
    }));
  });

  it('mocks Cloudinary upload streams without calling the provider', async () => {
    env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
    env.CLOUDINARY_API_KEY = 'test-key';
    env.CLOUDINARY_API_SECRET = 'test-secret';
    const { uploadStream } = mockCloudinary();

    await expect(uploadBuffer(Buffer.from('test image'), {
      folder: 'wardrowave/products/test-product',
    })).resolves.toEqual({
      url: 'https://images.example.test/test.jpg',
      publicId: 'wardrowave/test-image',
      width: 600,
      height: 800,
    });
    expect(uploadStream).toHaveBeenCalledWith(
      expect.objectContaining({ folder: 'wardrowave/products/test-product', resource_type: 'image' }),
      expect.any(Function)
    );
  });
});
