import mongoose from 'mongoose';
import { beforeEach, describe, expect, it } from '@jest/globals';
import { User } from '../../src/models/User.js';
import { Category } from '../../src/models/Category.js';
import { Product } from '../../src/models/Product.js';
import { Variant } from '../../src/models/Variant.js';
import { InventoryUnit } from '../../src/models/InventoryUnit.js';
import { ServiceablePincode } from '../../src/models/ServiceablePincode.js';
import { mockRazorpay } from '../helpers/providerMocks.js';

let createBooking;
let user;
let variant;
let product;
let nextStart;
let nextEnd;
const integrationEnabled = process.env.RUN_MONGO_INTEGRATION === 'true';
const integrationIt = integrationEnabled ? it : it.skip;

({ createBooking } = await import('../../src/services/booking.service.js'));

beforeEach(async () => {
  if (!integrationEnabled) return;
  mockRazorpay({
    createOrder: async ({ amount, currency }) => ({
      id: 'order_concurrency_test',
      amount,
      currency,
    }),
  });
  const category = await Category.create({ name: 'Occasion Wear', slug: 'occasion-wear' });
  product = await Product.create({
    title: 'Concurrency Outfit',
    slug: 'concurrency-outfit',
    description: 'An outfit used to verify exclusive booking holds.',
    category: category._id,
    gender: 'women',
    images: [{ url: 'https://wardrowave.invalid/image.jpg', isPrimary: true }],
    pricing: {
      basePrice: 10000,
      extraDayPrice: 1000,
      securityDeposit: 5000,
      minRentalDays: 3,
      maxRentalDays: 14,
      deliveryBufferDays: 1,
      returnBufferDays: 2,
    },
    status: 'published',
  });
  variant = await Variant.create({
    product: product._id,
    sku: 'CONCURRENCY-OUTFIT-M',
    size: 'M',
    color: 'Blue',
  });
  await InventoryUnit.create({
    product: product._id,
    variant: variant._id,
    unitCode: 'WW-CONCURRENCY-001',
  });
  user = await User.create({
    firebaseUid: 'concurrency-user',
    email: 'concurrency@example.test',
    emailVerified: true,
    name: 'Concurrency User',
    role: 'customer',
    addresses: [{
      label: 'Home',
      fullName: 'Concurrency User',
      phone: '+919876543210',
      line1: '1 Test Street',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411001',
      isDefault: true,
    }],
  });
  await ServiceablePincode.create({
    pincode: '411001',
    city: 'Pune',
    state: 'Maharashtra',
    deliveryDays: 2,
    isActive: true,
  });
  const start = new Date();
  start.setDate(start.getDate() + 10);
  nextStart = start.toISOString().slice(0, 10);
  const end = new Date(start);
  end.setDate(end.getDate() + 2);
  nextEnd = end.toISOString().slice(0, 10);
});

describe('concurrent booking creation', () => {
  integrationIt(
    'allows only one checkout to hold a physical unit for overlapping dates',
    async () => {
      const request = (idempotencyKey) => createBooking({
        user,
        idempotencyKey,
        body: {
          addressId: user.addresses[0]._id.toString(),
          items: [{ variantId: variant._id.toString(), startDate: nextStart, endDate: nextEnd }],
        },
      });

      const results = await Promise.allSettled([request('checkout-a'), request('checkout-b')]);
      expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
      const rejected = results.find((result) => result.status === 'rejected');
      expect(rejected.reason.statusCode).toBe(409);
      expect(rejected.reason.code).toBe('ITEM_UNAVAILABLE');
      expect(await mongoose.model('Reservation').countDocuments({ status: 'held' })).toBe(1);
    },
    120_000
  );
});
