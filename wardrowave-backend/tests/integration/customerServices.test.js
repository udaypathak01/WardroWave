import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import mongoose from 'mongoose';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { AuditLog } from '../../src/models/AuditLog.js';
import { Booking } from '../../src/models/Booking.js';
import { Cart } from '../../src/models/Cart.js';
import { Category } from '../../src/models/Category.js';
import { EmailOutbox } from '../../src/models/EmailOutbox.js';
import { Notification } from '../../src/models/Notification.js';
import { Product } from '../../src/models/Product.js';
import { Review } from '../../src/models/Review.js';
import { ServiceablePincode } from '../../src/models/ServiceablePincode.js';
import { Wishlist } from '../../src/models/Wishlist.js';
import { WardrobeImage } from '../../src/models/WardrobeImage.js';
import {
  getProductBySlug,
  getPincodeServiceability,
  getSlugAvailability,
  listActiveCategories,
  listPublishedProducts,
  listSimilarProducts,
} from '../../src/services/catalog.service.js';
import {
  addCartItem,
  clearCart,
  getCart,
  removeCartItem,
  setCartCoupon,
} from '../../src/services/cart.service.js';
import { createQuote } from '../../src/services/quote.service.js';
import {
  createReview,
  listProductReviewsBySlug,
  moderateReview,
} from '../../src/services/review.service.js';
import {
  addAddress,
  deleteAddress,
  getProfile,
  listNotifications,
  markNotificationRead,
  updateAddress,
  updateProfile,
} from '../../src/services/user.service.js';
import {
  addWishlistProduct,
  getWishlist,
  removeWishlistProduct,
} from '../../src/services/wishlist.service.js';
import { listBookings } from '../../src/services/booking.service.js';
import { addCalendarDays, formatRentalDate } from '../../src/utils/dates.js';
import { authHeader, createBooking, createProductWithUnits, createUser } from '../helpers/factories.js';
import { mockCloudinary, mockFirebaseAuth } from '../helpers/providerMocks.js';

const enabled = process.env.RUN_MONGO_INTEGRATION === 'true';
const integrationIt = enabled ? it : it.skip;
const app = createApp();
let user;
let product;
let variant;
let startDate;
let endDate;

beforeEach(async () => {
  if (!enabled) return;
  user = await createUser();
  ({ product, variant } = await createProductWithUnits());
  startDate = formatRentalDate(addCalendarDays(new Date(), 10));
  endDate = formatRentalDate(addCalendarDays(new Date(startDate), 2));
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('customer commerce services integration', () => {
  integrationIt('lists only the authenticated customer bookings with pagination metadata', async () => {
    const booking = await createBooking({
      user,
      product,
      variant,
      status: 'completed',
    });
    const newerBooking = await createBooking({
      user,
      product,
      variant,
      status: 'completed',
    });
    const otherUser = await createUser();
    const otherBooking = await createBooking({
      user: otherUser,
      product,
      variant,
      status: 'completed',
    });
    const listing = await listBookings(user._id, { page: 1, limit: 1 });
    expect(listing.items).toHaveLength(1);
    expect(String(listing.items[0]._id)).toBe(String(newerBooking._id));
    expect(listing.items[0]).not.toHaveProperty('idempotencyKey');
    expect(listing.meta).toEqual({ page: 1, limit: 1, total: 2, pages: 2 });
    const secondPage = await listBookings(user._id, { page: 2, limit: 1 });
    expect(String(secondPage.items[0]._id)).toBe(String(booking._id));

    mockFirebaseAuth(async (token) => ({ uid: token, email_verified: true }));
    const response = await request(app)
      .get('/api/v1/bookings?page=1&limit=1')
      .set('Authorization', `Bearer ${user.firebaseUid}`);
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]._id).toBe(String(newerBooking._id));
    expect(response.body.data).not.toContainEqual(expect.objectContaining({ _id: String(otherBooking._id) }));
    expect(response.body.meta).toEqual({ page: 1, limit: 1, total: 2, pages: 2, totalPages: 2 });
  });

  integrationIt('routes profile, address, notification, cart, and wishlist actions through controllers', async () => {
    mockFirebaseAuth(async (token) => ({ uid: token, email_verified: true }));
    const authorization = `Bearer ${user.firebaseUid}`;

    await expect(request(app).get('/api/v1/users/me').set('Authorization', authorization))
      .resolves.toMatchObject({ status: 200, body: { data: { name: 'Test Renter' } } });
    await expect(request(app)
      .patch('/api/v1/users/me')
      .set('Authorization', authorization)
      .send({ name: 'Controller Renter' }))
      .resolves.toMatchObject({ status: 200, body: { data: { name: 'Controller Renter' } } });

    const addressResponse = await request(app)
      .post('/api/v1/users/me/addresses')
      .set('Authorization', authorization)
      .send({
        label: 'Office',
        fullName: 'Controller Renter',
        phone: '+919876543210',
        line1: '3 Test Road',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411001',
      });

    expect(addressResponse.status).toBe(201);
    const addressId = addressResponse.body.data._id;
    await expect(request(app)
      .patch(`/api/v1/users/me/addresses/${addressId}`)
      .set('Authorization', authorization)
      .send({ label: 'Work' }))
      .resolves.toMatchObject({ status: 200, body: { data: { label: 'Work' } } });
    await expect(request(app)
      .delete(`/api/v1/users/me/addresses/${addressId}`)
      .set('Authorization', authorization))
      .resolves.toMatchObject({ status: 200, body: { data: { deleted: true } } });

    const notification = await Notification.create({
      user: user._id,
      type: 'booking',
      title: 'Controller notification',
      body: 'A new booking update.',
    });
    await expect(request(app)
      .get('/api/v1/users/me/notifications')
      .set('Authorization', authorization))
      .resolves.toMatchObject({
        status: 200,
        body: { data: { items: [expect.objectContaining({ title: 'Controller notification' })] } },
      });
    await expect(request(app)
      .patch(`/api/v1/users/me/notifications/${notification._id}/read`)
      .set('Authorization', authorization))
      .resolves.toMatchObject({ status: 200, body: { data: { title: 'Controller notification' } } });

    await expect(request(app).get('/api/v1/cart').set('Authorization', authorization))
      .resolves.toMatchObject({ status: 200, body: { data: { items: [] } } });
    const cartResponse = await request(app)
      .post('/api/v1/cart/items')
      .set('Authorization', authorization)
      .send({ variantId: String(variant._id), startDate, endDate });
    expect(cartResponse.status).toBe(201);
    const cartItemId = cartResponse.body.data.items[0]._id;
    await expect(request(app)
      .patch('/api/v1/cart/coupon')
      .set('Authorization', authorization)
      .send({ couponCode: 'spring20' }))
      .resolves.toMatchObject({ status: 200, body: { data: { couponCode: 'SPRING20' } } });
    await expect(request(app)
      .delete(`/api/v1/cart/items/${cartItemId}`)
      .set('Authorization', authorization))
      .resolves.toMatchObject({ status: 200 });
    await expect(request(app)
      .delete('/api/v1/cart')
      .set('Authorization', authorization))
      .resolves.toMatchObject({ status: 200, body: { data: { cleared: true } } });

    await expect(request(app).get('/api/v1/wishlist').set('Authorization', authorization))
      .resolves.toMatchObject({ status: 200, body: { data: { products: [] } } });
    const wishlistResponse = await request(app)
      .post(`/api/v1/wishlist/${product._id}`)
      .set('Authorization', authorization);
    expect(wishlistResponse.status).toBe(201);
    expect(wishlistResponse.body.data.products.map(String)).toEqual([String(product._id)]);
    await expect(request(app)
      .delete(`/api/v1/wishlist/${product._id}`)
      .set('Authorization', authorization))
      .resolves.toMatchObject({ status: 200 });
  });

  integrationIt('uploads wardrobe images through Cloudinary and enforces per-user ownership', async () => {
    const { destroy } = mockCloudinary();
    mockFirebaseAuth(async (token) => ({ uid: token, email_verified: true }));
    const imageBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const uploaded = await request(app)
      .post('/api/v1/users/me/wardrobe')
      .set(authHeader(user))
      .attach('image', imageBytes, { filename: 'wardrobe.png', contentType: 'image/png' });
    expect(uploaded.status).toBe(201);
    expect(uploaded.body.data).toMatchObject({
      url: 'https://images.example.test/test.jpg',
      width: 600,
      height: 800,
      format: 'png',
      bytes: imageBytes.length,
    });
    expect(uploaded.body.data).not.toHaveProperty('publicId');
    expect(uploaded.body.data).not.toHaveProperty('user');

    await expect(request(app)
      .get('/api/v1/users/me/wardrobe')
      .set(authHeader(user)))
      .resolves.toMatchObject({
        status: 200,
        body: { data: [expect.objectContaining({ _id: uploaded.body.data._id })] },
      });

    const otherUser = await createUser();
    await expect(request(app)
      .delete(`/api/v1/users/me/wardrobe/${uploaded.body.data._id}`)
      .set(authHeader(otherUser)))
      .resolves.toMatchObject({ status: 404 });
    await expect(WardrobeImage.countDocuments({ user: otherUser._id })).resolves.toBe(0);

    await expect(request(app)
      .delete(`/api/v1/users/me/wardrobe/${uploaded.body.data._id}`)
      .set(authHeader(user)))
      .resolves.toMatchObject({ status: 200, body: { data: { deleted: true } } });
    expect(destroy).toHaveBeenCalledWith(
      'wardrowave/test-image',
      { resource_type: 'image', invalidate: true },
    );
  });

  integrationIt('queues validated contact messages for support without sending email inline', async () => {
    const response = await request(app)
      .post('/api/v1/contact')
      .send({
        name: 'A Customer',
        email: 'customer@example.com',
        phone: '+919876543210',
        subject: 'Rental question',
        message: 'Can you help me choose a rental date?',
      });

    expect(response.status).toBe(202);
    expect(response.body).toMatchObject({
      success: true,
      data: { accepted: true },
    });
    const queued = await EmailOutbox.findOne({ subject: 'Contact inquiry: Rental question' }).lean();
    expect(queued).toMatchObject({
      to: expect.any(String),
      template: 'support-contact',
      status: 'queued',
      context: {
        email: 'customer@example.com',
        message: 'Can you help me choose a rental date?',
      },
    });

    await expect(request(app)
      .post('/api/v1/contact')
      .send({
        name: 'A Customer',
        email: 'not-an-email',
        subject: 'Invalid',
        message: 'Invalid email should be rejected.',
      }))
      .resolves.toMatchObject({
        status: 400,
        body: { success: false, error: { code: 'VALIDATION_ERROR' } },
      });
  });

  integrationIt('persists cart items idempotently and manages coupon and clearing state', async () => {
    await expect(getCart(user._id)).resolves.toEqual({ items: [], couponCode: null });
    await setCartCoupon(user._id, ' spring10 ');
    const first = await addCartItem({ userId: user._id, variantId: variant._id, startDate, endDate });
    const duplicate = await addCartItem({ userId: user._id, variantId: variant._id, startDate, endDate });

    expect(first.items).toHaveLength(1);
    expect(duplicate.items).toHaveLength(1);
    await expect(Cart.findOne({ user: user._id }).lean()).resolves.toMatchObject({
      couponCode: 'SPRING10',
    });

    await removeCartItem(user._id, first.items[0]._id);
    await expect(getCart(user._id)).resolves.toMatchObject({ items: [], couponCode: 'SPRING10' });
    await clearCart(user._id);
    const cleared = await getCart(user._id);
    expect(cleared.items).toEqual([]);
    expect(cleared.couponCode).toBeUndefined();
    await expect(removeCartItem(user._id, new mongoose.Types.ObjectId()))
      .resolves.toMatchObject({ items: [] });
  });

  integrationIt('rejects invalid cart variants and rental windows', async () => {
    await expect(addCartItem({
      userId: user._id,
      variantId: new mongoose.Types.ObjectId(),
      startDate,
      endDate,
    })).rejects.toMatchObject({ statusCode: 404 });
    await expect(addCartItem({
      userId: user._id,
      variantId: variant._id,
      startDate: 'invalid',
      endDate,
    })).rejects.toMatchObject({ statusCode: 400 });
  });

  integrationIt('keeps wishlist additions unique and removes products idempotently', async () => {
    await expect(getWishlist(user._id)).resolves.toEqual({ products: [] });
    await addWishlistProduct(user._id, product._id);
    await addWishlistProduct(user._id, product._id);
    await expect(Wishlist.findOne({ user: user._id }).lean()).resolves.toMatchObject({
      products: [product._id],
    });
    await expect(addWishlistProduct(user._id, new mongoose.Types.ObjectId()))
      .rejects.toMatchObject({ statusCode: 404 });

    await removeWishlistProduct(user._id, product._id);
    await removeWishlistProduct(user._id, product._id);
    await expect(getWishlist(user._id)).resolves.toMatchObject({ products: [] });
  });

  integrationIt('builds a trusted quote with current availability and serviceability', async () => {
    await ServiceablePincode.create({
      pincode: '411001',
      city: 'Pune',
      state: 'Maharashtra',
      deliveryDays: 2,
    });

    const quote = await createQuote({
      items: [{ variantId: variant._id, startDate, endDate }],
      pincode: '411001',
      user,
    });

    expect(quote.items).toHaveLength(1);
    expect(quote.items[0]).toMatchObject({
      productId: product._id,
      variantId: variant._id,
      rentalDays: 3,
      rentalCharge: 10_000,
      available: true,
      availableCount: 1,
      failureReason: null,
    });
    expect(quote.grandTotal).toBeGreaterThan(quote.depositTotal);
  });

  integrationIt('lists, enriches, and relates published catalog products', async () => {
    await Product.updateOne(
      { _id: product._id },
      { $set: { occasions: ['wedding'], brand: 'WardroWave' } }
    );
    const related = await createProductWithUnits({
      category: product.category,
      occasions: ['wedding'],
      brand: 'WardroWave',
    });
    const childCategory = await Category.create({
      name: 'Child Category',
      slug: `child-${new mongoose.Types.ObjectId()}`,
      parent: product.category,
    });
    await ServiceablePincode.create({
      pincode: '411001',
      city: 'Pune',
      state: 'Maharashtra',
      deliveryDays: 2,
    });
    await addWishlistProduct(user._id, product._id);

    const categories = await listActiveCategories();
    const rootCategory = categories.find(({ _id }) => String(_id) === String(product.category));
    expect(rootCategory.children.map(({ _id }) => String(_id))).toContain(String(childCategory._id));

    const paginatedListing = await listPublishedProducts({
      page: 1,
      limit: 1,
      brand: 'wardrowave',
      size: 'm',
      minPrice: 10_000,
      maxPrice: 10_000,
      sort: 'price_asc',
    });
    expect(paginatedListing.meta.total).toBe(2);
    expect(paginatedListing.items).toHaveLength(1);
    expect(paginatedListing.meta.facets.sizes).toEqual([{ value: 'M', count: 2 }]);

    const listing = await listPublishedProducts({
      page: 1,
      limit: 1,
      brand: 'wardrowave',
      size: 'm',
      minPrice: 10_000,
      maxPrice: 10_000,
      available: true,
      startDate,
      endDate,
      userId: user._id,
      sort: 'price_asc',
    });
    expect(listing.meta.total).toBe(2);
    expect(listing.items).toHaveLength(1);
    expect(listing.items[0]).toMatchObject({
      price: 10_000,
      isWishlisted: true,
    });
    expect(listing.meta.facets.sizes).toEqual([{ value: 'M', count: 2 }]);

    const viewCountBeforeExport = (await Product.findById(product._id).lean()).viewCount ?? 0;
    const exportResponse = await request(app)
      .get('/api/v1/catalog/prerender/products?limit=100');
    expect(exportResponse.status).toBe(200);
    expect(exportResponse.body.data).toEqual(expect.arrayContaining([
      expect.objectContaining({
        slug: product.slug,
        variants: expect.arrayContaining([
          expect.objectContaining({ size: 'M', active: true }),
        ]),
      }),
    ]));
    await expect(Product.findById(product._id).lean())
      .resolves.toMatchObject({ viewCount: viewCountBeforeExport });

    const details = await getProductBySlug(product.slug);
    expect(details.variants[0].active).toBe(true);
    expect(details.ratingSummary).toEqual({ average: product.ratingAvg, count: product.ratingCount });
    await expect(Product.findById(product._id).lean()).resolves.toMatchObject({ viewCount: 1 });
    await expect(listSimilarProducts(product.slug)).resolves.toHaveLength(1);

    await expect(getPincodeServiceability('411001')).resolves.toMatchObject({
      serviceable: true,
      city: 'Pune',
      estimatedDeliveryDays: 2,
    });
    await expect(getPincodeServiceability('000000')).resolves.toMatchObject({
      serviceable: false,
      estimatedDeliveryDays: null,
    });
    await expect(getSlugAvailability(product.slug, {
      variantId: variant._id,
      from: startDate,
      to: endDate,
      startDate,
      endDate,
    })).resolves.toMatchObject({ blockedDates: [], available: true, availableCount: 1 });
    await expect(listSimilarProducts('missing-product')).rejects.toMatchObject({ statusCode: 404 });
    await expect(getProductBySlug('missing-product')).resolves.toBeNull();
    await expect(getSlugAvailability('missing-product', {
      variantId: variant._id,
      from: startDate,
      to: endDate,
    })).rejects.toMatchObject({ statusCode: 404 });
    expect(String(related.product.category)).toBe(String(product.category));
  });

  integrationIt('updates profiles and maintains a single default address', async () => {
    await expect(getProfile(user._id)).resolves.toMatchObject({ name: 'Test Renter' });
    await expect(updateProfile(user._id, { name: 'Updated Renter' }))
      .resolves.toMatchObject({ name: 'Updated Renter' });

    const address = await addAddress(user._id, {
      label: 'Work',
      fullName: 'Updated Renter',
      phone: '+919876543210',
      line1: '2 Test Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      isDefault: true,
    });
    expect(address.isDefault).toBe(true);
    const afterAdding = await getProfile(user._id);
    expect(afterAdding.addresses.filter(({ isDefault }) => isDefault)).toHaveLength(1);
    expect(afterAdding.addresses[0].isDefault).toBe(false);

    const updated = await updateAddress(user._id, address._id, { label: 'Office' });
    expect(updated.label).toBe('Office');
    await expect(updateAddress(user._id, address._id, { isDefault: false }))
      .rejects.toMatchObject({ statusCode: 400 });
    await deleteAddress(user._id, address._id);
    await expect(getProfile(user._id)).resolves.toMatchObject({
      addresses: [expect.objectContaining({ isDefault: true })],
    });
  });

  integrationIt('paginates notifications with an owned cursor and marks them read', async () => {
    const old = await Notification.create({
      user: user._id,
      type: 'booking',
      title: 'Older notification',
      body: 'Older update',
      createdAt: new Date(Date.now() - 60_000),
    });
    await Notification.create({
      user: user._id,
      type: 'booking',
      title: 'Newer notification',
      body: 'Newer update',
    });

    const firstPage = await listNotifications(user._id, { limit: 1 });
    expect(firstPage.items[0].title).toBe('Newer notification');
    expect(firstPage.nextCursor).toBeTruthy();
    const secondPage = await listNotifications(user._id, { limit: 1, cursor: firstPage.nextCursor });
    expect(secondPage.items[0].title).toBe('Older notification');
    expect(secondPage.nextCursor).toBeNull();
    await expect(listNotifications(user._id, {
      limit: 1,
      cursor: new mongoose.Types.ObjectId(),
    })).rejects.toMatchObject({ statusCode: 400 });
    await expect(markNotificationRead(user._id, old._id))
      .resolves.toMatchObject({ id: String(old._id), title: 'Older notification' });
    await expect(markNotificationRead(user._id, new mongoose.Types.ObjectId()))
      .rejects.toMatchObject({ statusCode: 404 });
  });

  integrationIt('creates and moderates reviews only for completed product rentals', async () => {
    const booking = await createBooking({
      user,
      product,
      variant,
      status: 'completed',
    });
    const review = await createReview({
      userId: user._id,
      productId: product._id,
      input: {
        bookingId: booking._id,
        rating: 5,
        title: 'Great fit',
        comment: 'Clean and exactly as described.',
        fitFeedback: 'true_to_size',
      },
    });
    expect(review.status).toBe('pending');
    await expect(createReview({
      userId: user._id,
      productId: product._id,
      input: { bookingId: new mongoose.Types.ObjectId(), rating: 4, title: 'No booking', comment: 'No rental' },
    })).rejects.toMatchObject({ statusCode: 403 });

    const actor = await createUser({ role: 'admin' });
    await moderateReview({
      reviewId: review._id,
      status: 'approved',
      actor,
      request: { ip: '127.0.0.1', userAgent: 'integration-test' },
    });
    const listing = await listProductReviewsBySlug(product.slug, { page: 1, limit: 10 });
    expect(listing.items).toHaveLength(1);
    expect(listing.meta.ratingHistogram).toEqual({ 5: 1 });
    expect(listing.meta.fitFeedback).toEqual({ true_to_size: 1 });
    await expect(Product.findById(product._id).lean()).resolves.toMatchObject({
      ratingAvg: 5,
      ratingCount: 1,
    });
    await expect(AuditLog.countDocuments({ action: 'review.moderated' })).resolves.toBe(1);
    await expect(Booking.countDocuments({ _id: booking._id })).resolves.toBe(1);
    await expect(listProductReviewsBySlug('missing-product', { page: 1, limit: 10 }))
      .rejects.toMatchObject({ statusCode: 404 });
    await expect(Review.countDocuments({ booking: booking._id })).resolves.toBe(1);
  });
});
