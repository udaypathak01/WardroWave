import { randomUUID } from 'node:crypto';
import { Booking } from '../../src/models/Booking.js';
import { Category } from '../../src/models/Category.js';
import { InventoryUnit } from '../../src/models/InventoryUnit.js';
import { Product } from '../../src/models/Product.js';
import { User } from '../../src/models/User.js';
import { Variant } from '../../src/models/Variant.js';
import { hmacSha256 } from '../../src/utils/crypto.js';
import { addCalendarDays, formatRentalDate, parseRentalDate } from '../../src/utils/dates.js';

export async function createUser({ role = 'customer', status = 'active', ...overrides } = {}) {
  const suffix = randomUUID();
  return User.create({
    firebaseUid: `firebase-${suffix}`,
    email: `${suffix}@example.test`,
    emailVerified: true,
    name: 'Test Renter',
    role,
    status,
    addresses: [{
      label: 'Home',
      fullName: 'Test Renter',
      phone: '+919876543210',
      line1: '1 Test Street',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411001',
      isDefault: true,
    }],
    ...overrides,
  });
}

export function authHeader(user) {
  return { Authorization: `Bearer ${user.firebaseUid}` };
}

export async function createProductWithUnits({ unitCount = 1, ...overrides } = {}) {
  const suffix = randomUUID();
  const category = await Category.create({
    name: `Test Category ${suffix}`,
    slug: `test-category-${suffix}`,
  });
  const product = await Product.create({
    title: 'Integration Test Outfit',
    slug: `integration-test-${suffix}`,
    description: 'A product created by the integration-test factory.',
    category: category._id,
    gender: 'unisex',
    images: [{ url: 'https://wardrowave.invalid/test-image.jpg', isPrimary: true }],
    pricing: {
      basePrice: 10_000,
      extraDayPrice: 1_000,
      securityDeposit: 5_000,
      minRentalDays: 3,
      maxRentalDays: 14,
      deliveryBufferDays: 1,
      returnBufferDays: 2,
    },
    status: 'published',
    ...overrides,
  });
  const variant = await Variant.create({
    product: product._id,
    sku: `TEST-${suffix}`,
    size: 'M',
    color: 'Blue',
  });
  const units = await InventoryUnit.insertMany(
    Array.from({ length: unitCount }, (_, index) => ({
      product: product._id,
      variant: variant._id,
      unitCode: `TEST-UNIT-${suffix}-${index}`,
    }))
  );
  return { category, product, variant, units };
}

export async function createBooking({ user, product, variant, unit, ...overrides }) {
  if (!user || !product || !variant) {
    throw new TypeError('createBooking requires user, product, and variant fixtures');
  }
  const startDate = parseRentalDate(formatRentalDate(addCalendarDays(new Date(), 10)));
  const endDate = parseRentalDate(formatRentalDate(addCalendarDays(startDate, 2)));
  const bookingNumber = `WW-TEST-${randomUUID()}`;
  return Booking.create({
    bookingNumber,
    user: user._id,
    items: [{
      product: product._id,
      variant: variant._id,
      ...(unit ? { unit: unit._id } : {}),
      titleSnapshot: product.title,
      startDate,
      endDate,
      rentalDays: 3,
      rentalCharge: 10_000,
      securityDeposit: product.pricing.securityDeposit,
      status: 'pending',
    }],
    shippingAddress: user.addresses[0].toObject(),
    deliveryPincode: user.addresses[0].pincode,
    pricing: {
      rentalSubtotal: 10_000,
      discount: 0,
      deliveryFee: 9_900,
      taxableAmount: 19_900,
      gstPercent: 12,
      gstAmount: 2_388,
      depositTotal: product.pricing.securityDeposit,
      grandTotal: 22_288 + product.pricing.securityDeposit,
    },
    status: 'pending_payment',
    payment: { status: 'created' },
    ...overrides,
  });
}

export function signRazorpay(orderId, paymentId, secret = process.env.RAZORPAY_KEY_SECRET) {
  if (!secret) throw new Error('RAZORPAY_KEY_SECRET is required to sign a test payment');
  return hmacSha256(`${orderId}|${paymentId}`, secret);
}

export function signWebhook(body, secret = process.env.RAZORPAY_WEBHOOK_SECRET) {
  if (!secret) throw new Error('RAZORPAY_WEBHOOK_SECRET is required to sign a test webhook');
  const rawBody = Buffer.isBuffer(body) ? body : Buffer.from(JSON.stringify(body));
  return { rawBody, signature: hmacSha256(rawBody, secret) };
}
