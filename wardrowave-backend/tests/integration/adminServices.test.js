import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import mongoose from 'mongoose';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { AuditLog } from '../../src/models/AuditLog.js';
import { Booking } from '../../src/models/Booking.js';
import { Coupon } from '../../src/models/Coupon.js';
import { InventoryUnit } from '../../src/models/InventoryUnit.js';
import { Product } from '../../src/models/Product.js';
import { Reservation } from '../../src/models/Reservation.js';
import { Review } from '../../src/models/Review.js';
import { User } from '../../src/models/User.js';
import {
  addProductImages,
  archiveProduct,
  createCategory,
  createProduct,
  createVariant,
  removeProductImage,
  reorderProductImages,
  updateCategory,
  updateInventoryStatus,
  updateProduct,
} from '../../src/services/adminCatalog.service.js';
import { createCatalogUploadSignature } from '../../src/services/upload.service.js';
import { createCoupon, updateCoupon } from '../../src/services/adminCoupon.service.js';
import { env } from '../../src/config/env.js';
import { createProductWithUnits, createUser } from '../helpers/factories.js';
import { mockCloudinary, mockFirebaseAuth } from '../helpers/providerMocks.js';

const enabled = process.env.RUN_MONGO_INTEGRATION === 'true';
const integrationIt = enabled ? it : it.skip;
const app = createApp();
let actor;
let requestContext;
let category;
let product;

beforeEach(async () => {
  if (!enabled) return;
  actor = await createUser({ role: 'admin' });
  requestContext = { ip: '127.0.0.1', userAgent: 'integration-test' };
  ({ category, product } = await createProductWithUnits());
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('admin catalog and coupon service integration', () => {
  integrationIt('routes administration actions through authenticated controllers', async () => {
    const now = Math.floor(Date.now() / 1000);
    mockFirebaseAuth(async (token) => ({
      uid: token,
      email_verified: true,
      auth_time: token === 'stale-admin' ? now - 10_000 : now,
      ...(token === 'superadmin-without-mfa' ? {} : { firebase: { sign_in_second_factor: 'totp' } }),
    }));
    const authorization = `Bearer ${actor.firebaseUid}`;
    const superadmin = await createUser({ role: 'superadmin', firebaseUid: 'integration-superadmin' });
    await createUser({ role: 'superadmin', firebaseUid: 'superadmin-without-mfa' });
    await createUser({ role: 'superadmin', firebaseUid: 'stale-admin' });
    const superadminAuthorization = `Bearer ${superadmin.firebaseUid}`;
    await expect(request(app).get('/api/v1/admin/settings').set('Authorization', authorization))
      .resolves.toMatchObject({ status: 200, body: { success: true } });
    await expect(request(app)
      .patch('/api/v1/admin/settings')
      .set('Authorization', authorization)
      .send({ deliveryFee: 2_000 }))
      .resolves.toMatchObject({ status: 403 });

    const previousMfaPolicy = env.ADMIN_REQUIRE_MFA;
    env.ADMIN_REQUIRE_MFA = true;
    try {
      await expect(request(app)
        .patch('/api/v1/admin/settings')
        .set('Authorization', 'Bearer superadmin-without-mfa')
        .send({ deliveryFee: 2_000 }))
        .resolves.toMatchObject({ status: 403, body: { error: { code: 'MFA_REQUIRED' } } });
      await expect(request(app)
        .patch('/api/v1/admin/settings')
        .set('Authorization', 'Bearer stale-admin')
        .send({ deliveryFee: 2_000 }))
        .resolves.toMatchObject({ status: 401, body: { error: { code: 'REAUTH_REQUIRED' } } });
      await expect(request(app)
        .patch('/api/v1/admin/settings')
        .set('Authorization', superadminAuthorization)
        .send({ deliveryFee: 2_000 }))
        .resolves.toMatchObject({ status: 200, body: { data: { deliveryFee: 2_000 } } });
    } finally {
      env.ADMIN_REQUIRE_MFA = previousMfaPolicy;
    }

    const categoryResponse = await request(app)
      .post('/api/v1/admin/categories')
      .set('Authorization', authorization)
      .send({ name: 'Controller Category' });
    expect(categoryResponse.status).toBe(201);
    const categoryId = categoryResponse.body.data._id;
    await expect(request(app)
      .patch(`/api/v1/admin/categories/${categoryId}`)
      .set('Authorization', authorization)
      .send({ sortOrder: 2 }))
      .resolves.toMatchObject({ status: 200, body: { data: { sortOrder: 2 } } });

    const productResponse = await request(app)
      .post('/api/v1/admin/products')
      .set('Authorization', authorization)
      .send({
        title: 'Controller Product',
        description: 'Created through the admin controller.',
        category: String(category._id),
        gender: 'unisex',
        images: [{ url: 'https://example.test/controller-product.jpg', isPrimary: true }],
        pricing: { basePrice: 10_000, extraDayPrice: 1_000, securityDeposit: 5_000 },
        status: 'draft',
      });
    expect(productResponse.status).toBe(201);
    const productId = productResponse.body.data._id;
    await expect(request(app)
      .patch(`/api/v1/admin/products/${productId}`)
      .set('Authorization', authorization)
      .send({ title: 'Renamed Controller Product' }))
      .resolves.toMatchObject({ status: 200, body: { data: { slug: 'renamed-controller-product' } } });
    await expect(request(app)
      .patch(`/api/v1/admin/products/${productId}`)
      .set('Authorization', authorization)
      .send({ status: 'published' }))
      .resolves.toMatchObject({ status: 409 });

    const variantResponse = await request(app)
      .post(`/api/v1/admin/products/${productId}/variants`)
      .set('Authorization', authorization)
      .send({ sku: 'CONTROLLER-SKU', size: 'L', color: 'Black', unitCodes: ['CONTROLLER-UNIT'] });
    expect(variantResponse.status).toBe(201);
    const unitId = variantResponse.body.data.units[0]._id;
    await request(app)
      .patch(`/api/v1/admin/inventory/${unitId}/status`)
      .set('Authorization', authorization)
      .send({ status: 'maintenance' });
    await expect(request(app)
      .patch(`/api/v1/admin/products/${productId}`)
      .set('Authorization', authorization)
      .send({ status: 'published' }))
      .resolves.toMatchObject({ status: 409 });
    await request(app)
      .patch(`/api/v1/admin/inventory/${unitId}/status`)
      .set('Authorization', authorization)
      .send({ status: 'available' });
    await expect(request(app)
      .patch(`/api/v1/admin/products/${productId}`)
      .set('Authorization', authorization)
      .send({ status: 'published' }))
      .resolves.toMatchObject({ status: 200, body: { data: { status: 'published' } } });
    await expect(request(app)
      .patch(`/api/v1/admin/inventory/${unitId}/status`)
      .set('Authorization', authorization)
      .send({ status: 'maintenance' }))
      .resolves.toMatchObject({ status: 200, body: { data: { status: 'maintenance' } } });

    const target = await createUser();
    await expect(request(app)
      .patch(`/api/v1/admin/users/${target._id}/access`)
      .set('Authorization', authorization)
      .send({ role: 'staff' }))
      .resolves.toMatchObject({ status: 403 });
    const accessChange = await request(app)
      .patch(`/api/v1/admin/users/${target._id}/access`)
      .set('Authorization', superadminAuthorization)
      .set('X-Request-Id', 'superadmin-role-change')
      .send({ role: 'staff' });
    expect(accessChange).toMatchObject({ status: 200, body: { data: { role: 'staff' } } });
    await expect(User.findById(target._id).lean()).resolves.toMatchObject({ role: 'staff' });
    await expect(AuditLog.findOne({ entityId: target._id }).lean())
      .resolves.toMatchObject({ requestId: 'superadmin-role-change', actorRole: 'superadmin' });

    const booking = await Booking.create({
      bookingNumber: `WW-ADMIN-REVIEW-${new mongoose.Types.ObjectId()}`,
      user: target._id,
      items: [{
        product: productId,
        variant: variantResponse.body.data.variant._id,
        titleSnapshot: 'Controller Product',
        startDate: new Date(),
        endDate: new Date(),
        rentalDays: 1,
        rentalCharge: 10_000,
        securityDeposit: 5_000,
      }],
      shippingAddress: target.addresses[0].toObject(),
      pricing: {
        rentalSubtotal: 10_000,
        deliveryFee: 0,
        taxableAmount: 10_000,
        gstPercent: 0,
        gstAmount: 0,
        depositTotal: 5_000,
        grandTotal: 15_000,
      },
      status: 'completed',
    });
    const review = await Review.create({
      booking: booking._id,
      user: target._id,
      product: productId,
      rating: 4,
      title: 'Controller review',
      comment: 'A review for moderation.',
    });
    await expect(request(app)
      .patch(`/api/v1/admin/reviews/${review._id}/moderation`)
      .set('Authorization', authorization)
      .send({ status: 'approved' }))
      .resolves.toMatchObject({ status: 200, body: { data: { status: 'approved' } } });

    const start = new Date();
    const ends = new Date(start.getTime() + 30 * 86_400_000);
    const couponResponse = await request(app)
      .post('/api/v1/admin/coupons')
      .set('Authorization', authorization)
      .send({
        code: 'CONTROLLER-COUPON',
        type: 'flat',
        value: 500,
        startsAt: start.toISOString(),
        expiresAt: ends.toISOString(),
        applicableCategories: [],
        applicableProducts: [],
      });
    expect(couponResponse.status).toBe(201);
      const couponUpdateResponse = await request(app)
      .patch(`/api/v1/admin/coupons/${couponResponse.body.data._id}`)
      .set('Authorization', authorization)
        .send({
          isActive: false,
          startsAt: couponResponse.body.data.startsAt,
          expiresAt: couponResponse.body.data.expiresAt,
        });
      expect(couponUpdateResponse.body).toMatchObject({
        success: true,
        data: { isActive: false },
      });
    await expect(request(app)
      .put('/api/v1/admin/pincodes/411001')
      .set('Authorization', authorization)
      .send({ city: 'Pune', state: 'Maharashtra', deliveryDays: 2 }))
      .resolves.toMatchObject({ status: 200, body: { data: { pincode: '411001' } } });

    const originalCloudinaryConfig = {
      CLOUDINARY_CLOUD_NAME: env.CLOUDINARY_CLOUD_NAME,
      CLOUDINARY_API_KEY: env.CLOUDINARY_API_KEY,
      CLOUDINARY_API_SECRET: env.CLOUDINARY_API_SECRET,
    };
    env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
    env.CLOUDINARY_API_KEY = 'test-key';
    env.CLOUDINARY_API_SECRET = 'test-secret';
    try {
      await expect(request(app)
        .post(`/api/v1/admin/products/${productId}/upload-signature`)
        .set('Authorization', authorization))
        .resolves.toMatchObject({ status: 200, body: { data: { cloudName: 'test-cloud' } } });
      await expect(request(app)
        .post('/api/v1/admin/uploads/catalog-signature')
        .set('Authorization', authorization))
        .resolves.toMatchObject({ status: 200, body: { success: true } });
    } finally {
      env.CLOUDINARY_CLOUD_NAME = originalCloudinaryConfig.CLOUDINARY_CLOUD_NAME;
      env.CLOUDINARY_API_KEY = originalCloudinaryConfig.CLOUDINARY_API_KEY;
      env.CLOUDINARY_API_SECRET = originalCloudinaryConfig.CLOUDINARY_API_SECRET;
    }

    const today = new Date().toISOString().slice(0, 10);
    await expect(request(app)
      .get(`/api/v1/admin/reports/summary?from=${today}&to=${today}`)
      .set('Authorization', authorization))
      .resolves.toMatchObject({ status: 200, body: { data: { period: { from: today, to: today } } } });
    await expect(request(app)
      .delete(`/api/v1/admin/products/${productId}`)
      .set('Authorization', authorization))
      .resolves.toMatchObject({ status: 200, body: { data: { status: 'archived' } } });
  });

  integrationIt('creates, updates, and archives catalog records with audit entries', async () => {
    const newCategory = await createCategory({
      actor,
      input: { name: `Formal ${new mongoose.Types.ObjectId()}`, parent: category._id },
      request: requestContext,
    });
    expect(newCategory.slug).toMatch(/^formal-/);
    await expect(updateCategory({
      categoryId: newCategory._id,
      actor,
      input: { name: 'Updated Formal' },
      request: requestContext,
    })).resolves.toMatchObject({ name: 'Updated Formal', slug: 'updated-formal' });
    await expect(updateCategory({
      categoryId: category._id,
      actor,
      input: { parent: category._id },
      request: requestContext,
    })).rejects.toMatchObject({ statusCode: 400 });

    const created = await createProduct({
      actor,
      input: {
        title: `Admin Outfit ${new mongoose.Types.ObjectId()}`,
        description: 'Created by the admin integration suite.',
        category: category._id,
        gender: 'unisex',
        images: [{ url: 'https://images.example.test/admin.jpg', publicId: 'admin/initial', isPrimary: true }],
        pricing: { basePrice: 12_000, extraDayPrice: 1_000, securityDeposit: 4_000 },
        status: 'published',
      },
      request: requestContext,
    });
    expect(created.slug).toMatch(/^admin-outfit-/);
    const updated = await updateProduct({
      productId: created._id,
      actor,
      input: { title: 'Updated Admin Outfit', pricing: { basePrice: 15_000 } },
      request: requestContext,
    });
    expect(updated).toMatchObject({ slug: 'updated-admin-outfit', pricing: { basePrice: 15_000 } });
    await expect(archiveProduct({
      productId: created._id,
      actor,
      request: requestContext,
    })).resolves.toMatchObject({ status: 'archived' });
    await expect(AuditLog.countDocuments({ actor: actor._id })).resolves.toBe(5);
  });

  integrationIt('manages variants and inventory while respecting active reservations', async () => {
    const created = await createVariant({
      productId: product._id,
      actor,
      input: { sku: `ADMIN-${new mongoose.Types.ObjectId()}`, size: 'L', color: 'Black', unitCodes: ['ADMIN-UNIT-1', 'ADMIN-UNIT-2'] },
      request: requestContext,
    });
    expect(created.units).toHaveLength(2);
    const unitId = created.units[0]._id;
    await expect(updateInventoryStatus({
      unitId,
      status: 'maintenance',
      actor,
      request: requestContext,
    })).resolves.toMatchObject({ status: 'maintenance' });
    await expect(updateInventoryStatus({
      unitId,
      status: 'available',
      actor,
      request: requestContext,
    })).resolves.toMatchObject({ status: 'available' });

    const reservation = await Reservation.create({
      unit: unitId,
      variant: created.variant._id,
      product: product._id,
      user: actor._id,
      rentalStart: new Date(Date.now() + 10 * 86_400_000),
      rentalEnd: new Date(Date.now() + 13 * 86_400_000),
      blockStart: new Date(Date.now() + 9 * 86_400_000),
      blockEnd: new Date(Date.now() + 15 * 86_400_000),
      status: 'confirmed',
    });
    await expect(updateInventoryStatus({
      unitId,
      status: 'maintenance',
      actor,
      request: requestContext,
    })).rejects.toMatchObject({ statusCode: 409 });
    await Reservation.deleteOne({ _id: reservation._id });
    await expect(InventoryUnit.findById(unitId).lean()).resolves.toMatchObject({ status: 'available' });
  });

  integrationIt('uploads, reorders, and removes product images safely', async () => {
    const originalCloudinaryConfig = {
      CLOUDINARY_CLOUD_NAME: env.CLOUDINARY_CLOUD_NAME,
      CLOUDINARY_API_KEY: env.CLOUDINARY_API_KEY,
      CLOUDINARY_API_SECRET: env.CLOUDINARY_API_SECRET,
    };
    env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
    env.CLOUDINARY_API_KEY = 'test-key';
    env.CLOUDINARY_API_SECRET = 'test-secret';
    const cloudinary = mockCloudinary({
      uploadResult: {
        secure_url: 'https://images.example.test/second.jpg',
        public_id: 'wardrowave/test-second',
        width: 800,
        height: 1000,
      },
    });
    try {
      const withImage = await addProductImages({
        productId: product._id,
        actor,
        files: [{ buffer: Buffer.from('image bytes') }],
        request: requestContext,
      });
      expect(withImage.images).toHaveLength(2);
      const reordered = await reorderProductImages({
        productId: product._id,
        publicIds: ['wardrowave/test-second', withImage.images[0].publicId],
        primaryPublicId: 'wardrowave/test-second',
        actor,
        request: requestContext,
      });
      expect(reordered.images.map(({ publicId }) => publicId))
        .toEqual(['wardrowave/test-second', withImage.images[0].publicId]);
      expect(reordered.images[0]).toMatchObject({ isPrimary: true, sortOrder: 0 });
      await removeProductImage({
        productId: product._id,
        publicId: 'wardrowave/test-second',
        actor,
        request: requestContext,
      });
      expect(cloudinary.uploadStream).toHaveBeenCalledTimes(1);
      expect(cloudinary.destroy).toHaveBeenCalledWith(
        'wardrowave/test-second',
        expect.objectContaining({ resource_type: 'image' })
      );
      await expect(addProductImages({
        productId: product._id,
        actor,
        files: [],
        request: requestContext,
      })).rejects.toMatchObject({ statusCode: 400 });
      await expect(removeProductImage({
        productId: product._id,
        publicId: withImage.images[0].publicId,
        actor,
        request: requestContext,
      })).rejects.toMatchObject({ statusCode: 409 });
    } finally {
      env.CLOUDINARY_CLOUD_NAME = originalCloudinaryConfig.CLOUDINARY_CLOUD_NAME;
      env.CLOUDINARY_API_KEY = originalCloudinaryConfig.CLOUDINARY_API_KEY;
      env.CLOUDINARY_API_SECRET = originalCloudinaryConfig.CLOUDINARY_API_SECRET;
      cloudinary.uploadStream.mockRestore();
      cloudinary.destroy.mockRestore();
    }
  });

  integrationIt('signs scoped catalog uploads and manages targeted coupons', async () => {
    const originalCloudinaryConfig = {
      CLOUDINARY_CLOUD_NAME: env.CLOUDINARY_CLOUD_NAME,
      CLOUDINARY_API_KEY: env.CLOUDINARY_API_KEY,
      CLOUDINARY_API_SECRET: env.CLOUDINARY_API_SECRET,
    };
    env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
    env.CLOUDINARY_API_KEY = 'test-key';
    env.CLOUDINARY_API_SECRET = 'test-secret';
    try {
      expect(createCatalogUploadSignature(String(product._id))).toMatchObject({
        cloudName: 'test-cloud',
        apiKey: 'test-key',
        folder: `wardrowave/products/${product._id}`,
      });
      expect(() => createCatalogUploadSignature('invalid-id')).toThrow();
    } finally {
      env.CLOUDINARY_CLOUD_NAME = originalCloudinaryConfig.CLOUDINARY_CLOUD_NAME;
      env.CLOUDINARY_API_KEY = originalCloudinaryConfig.CLOUDINARY_API_KEY;
      env.CLOUDINARY_API_SECRET = originalCloudinaryConfig.CLOUDINARY_API_SECRET;
    }

    const now = new Date();
    const coupon = await createCoupon({
      actor,
      input: {
        code: 'spring-admin',
        type: 'percent',
        value: 10,
        startsAt: now,
        expiresAt: new Date(now.getTime() + 30 * 86_400_000),
        applicableCategories: [category._id],
        applicableProducts: [product._id],
      },
      request: requestContext,
    });
    expect(coupon.code).toBe('SPRING-ADMIN');
    await expect(updateCoupon({
      couponId: coupon._id,
      actor,
      input: { isActive: false },
      request: requestContext,
    })).resolves.toMatchObject({ isActive: false });
    await Coupon.updateOne({ _id: coupon._id }, { $set: { reservedCount: 2 } });
    await expect(updateCoupon({
      couponId: coupon._id,
      actor,
      input: { usageLimit: 1 },
      request: requestContext,
    })).rejects.toMatchObject({ statusCode: 409 });
    await expect(createCoupon({
      actor,
      input: {
        code: 'invalid-target',
        type: 'flat',
        value: 500,
        startsAt: now,
        expiresAt: new Date(now.getTime() + 30 * 86_400_000),
        applicableCategories: [new mongoose.Types.ObjectId()],
        applicableProducts: [],
      },
      request: requestContext,
    })).rejects.toMatchObject({ statusCode: 400 });
    await expect(Product.findById(product._id).lean()).resolves.toBeTruthy();
  });
});
