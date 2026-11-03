import { readdir, readFile } from 'node:fs/promises';
import { basename, extname, resolve } from 'node:path';
import { admin } from '../src/config/firebase.js';
import { connectDatabase, disconnectDatabase } from '../src/config/db.js';
import { env } from '../src/config/env.js';
import { Category } from '../src/models/Category.js';
import { Coupon } from '../src/models/Coupon.js';
import { InventoryUnit } from '../src/models/InventoryUnit.js';
import { Product } from '../src/models/Product.js';
import { ServiceablePincode } from '../src/models/ServiceablePincode.js';
import { User } from '../src/models/User.js';
import { Variant } from '../src/models/Variant.js';
import { deleteMany, uploadBuffer } from '../src/services/upload.service.js';
import { logger } from '../src/utils/logger.js';

const maxImageBytes = 5 * 1024 * 1024;
const maxImageCount = 8;

function imageDirectoryArgument() {
  const index = process.argv.indexOf('--images');
  if (index < 0 || !process.argv[index + 1] || process.argv[index + 1].startsWith('--')) {
    throw new Error('Provide real product photos with: npm run seed -- --images ./seed-images');
  }
  return resolve(process.argv[index + 1]);
}

function hasValidImageSignature(buffer, extension) {
  if (extension === '.jpg' || extension === '.jpeg') {
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (extension === '.png') {
    return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }
  if (extension === '.webp') {
    return buffer.length >= 12 &&
      buffer.toString('ascii', 0, 4) === 'RIFF' &&
      buffer.toString('ascii', 8, 12) === 'WEBP';
  }
  return false;
}

async function loadSeedImages(directory) {
  const entries = (await readdir(directory, { withFileTypes: true }))
    .filter((entry) => entry.isFile())
    .sort((left, right) => left.name.localeCompare(right.name));
  const imageEntries = entries.filter((entry) => ['.jpg', '.jpeg', '.png', '.webp'].includes(extname(entry.name).toLowerCase()));
  if (imageEntries.length === 0) {
    throw new Error(`No JPEG, PNG, or WebP images were found in ${directory}.`);
  }
  if (imageEntries.length > maxImageCount) {
    throw new Error(`Use no more than ${maxImageCount} product images per seed run.`);
  }
  const images = [];
  for (const entry of imageEntries) {
    const path = resolve(directory, entry.name);
    const buffer = await readFile(path);
    const extension = extname(entry.name).toLowerCase();
    if (buffer.length === 0 || buffer.length > maxImageBytes) {
      throw new Error(`${entry.name} must be between 1 byte and 5 MiB.`);
    }
    if (!hasValidImageSignature(buffer, extension)) {
      throw new Error(`${entry.name} does not match its JPEG, PNG, or WebP file extension.`);
    }
    images.push({
      fileName: entry.name,
      alt: basename(entry.name, extname(entry.name)).replace(/[_-]+/g, ' ').trim(),
      buffer,
    });
  }
  return images;
}

async function seedData(images) {
  const adminEmail = env.ADMIN_EMAILS.split(',').map((email) => email.trim().toLowerCase()).find(Boolean);
  if (!adminEmail) {
    throw new Error('Set ADMIN_EMAILS to an existing verified Firebase account before seeding.');
  }

  const firebaseAdmin = await admin.auth().getUserByEmail(adminEmail);
  if (!firebaseAdmin.emailVerified) {
    throw new Error('The Firebase admin account must have a verified email address.');
  }

  const adminUser = await User.findOneAndUpdate(
    { firebaseUid: firebaseAdmin.uid },
    {
      $set: {
        email: adminEmail,
        emailVerified: true,
        name: firebaseAdmin.displayName || adminEmail,
        role: 'admin',
        status: 'active',
      },
      $setOnInsert: { firebaseUid: firebaseAdmin.uid },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).exec();
  await admin.auth().setCustomUserClaims(firebaseAdmin.uid, { role: 'admin' });

  let testUserId;
  if (env.SEED_TEST_USER_EMAIL) {
    const testEmail = env.SEED_TEST_USER_EMAIL.trim().toLowerCase();
    if (testEmail === adminEmail) {
      throw new Error('SEED_TEST_USER_EMAIL must be different from the admin account.');
    }
    const firebaseTestUser = await admin.auth().getUserByEmail(testEmail);
    if (!firebaseTestUser.emailVerified) {
      throw new Error('The Firebase test account must have a verified email address.');
    }
    const existingTestUser = await User.findOne({ firebaseUid: firebaseTestUser.uid }).exec();
    if (existingTestUser && existingTestUser.role !== 'customer') {
      throw new Error('The Firebase test account is already assigned a privileged role.');
    }
    const testUser = await User.findOneAndUpdate(
      { firebaseUid: firebaseTestUser.uid },
      {
        $set: {
          email: testEmail,
          emailVerified: true,
          name: firebaseTestUser.displayName || 'WardroWave Test Customer',
          role: 'customer',
          status: 'active',
        },
        $setOnInsert: { firebaseUid: firebaseTestUser.uid },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).exec();
    testUserId = testUser._id;
  }

  const category = await Category.findOneAndUpdate(
    { slug: 'occasion-wear' },
    { $set: { name: 'Occasion Wear', isActive: true, sortOrder: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).exec();
  const product = await Product.findOneAndUpdate(
    { slug: 'wardrowave-evening-gown' },
    {
      $set: {
        title: 'WardroWave Evening Gown',
        description: 'A sample designer evening gown for rental catalogue development.',
        brand: 'WardroWave Studio',
        category: category._id,
        gender: 'women',
        occasions: ['party', 'formal'],
        tags: ['evening', 'gown', 'sample'],
        colors: ['Midnight Blue'],
        fabric: 'Georgette',
        careInstructions: ['Professional dry clean only'],
        pricing: {
          retailValue: 2500000,
          basePrice: 35000,
          extraDayPrice: 7500,
          securityDeposit: 50000,
          minRentalDays: 3,
          maxRentalDays: 14,
          deliveryBufferDays: 1,
          returnBufferDays: 2,
        },
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).exec();
  const uploadedImages = [];
  try {
    for (const [index, image] of images.entries()) {
      const upload = await uploadBuffer(image.buffer, {
        folder: `${env.CLOUDINARY_FOLDER}/products/${product._id}`,
        publicIdPrefix: `seed-${index + 1}`,
      });
      uploadedImages.push({
        ...upload,
        alt: image.alt || `WardroWave evening gown ${index + 1}`,
        isPrimary: index === 0,
        sortOrder: index,
      });
    }
    product.images = uploadedImages;
    product.status = 'published';
    await product.save();
  } catch (error) {
    await deleteMany(uploadedImages.map((image) => image.publicId));
    throw error;
  }
  const variant = await Variant.findOneAndUpdate(
    { product: product._id, size: 'M', color: 'Midnight Blue' },
    { $set: { sku: 'WW-EVENING-GOWN-M-BLUE', isActive: true } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).exec();
  await InventoryUnit.findOneAndUpdate(
    { unitCode: 'WW-EVG-0001-M-01' },
    {
      $set: {
        product: product._id,
        variant: variant._id,
        status: 'available',
        condition: 'new',
        maxRentCount: 30,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).exec();
  await Coupon.findOneAndUpdate(
    { code: 'WELCOME10' },
    {
      $set: {
        description: 'Sample 10% rental discount for development.',
        type: 'percent',
        value: 10,
        maxDiscount: 20000,
        minRentalSubtotal: 0,
        startsAt: new Date('2020-01-01T00:00:00.000Z'),
        expiresAt: new Date('2099-12-31T23:59:59.000Z'),
        usageLimit: 1000,
        perUserLimit: 1,
        isActive: true,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).exec();
  await ServiceablePincode.findOneAndUpdate(
    { pincode: '411001' },
    { $set: { city: 'Pune', state: 'Maharashtra', deliveryDays: 2, isActive: true } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).exec();

  logger.info({
    adminUserId: adminUser._id,
    testUserId,
    categoryId: category._id,
    productId: product._id,
    variantId: variant._id,
  }, 'Seed data synchronized');
}

try {
  const images = await loadSeedImages(imageDirectoryArgument());
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw new Error('Configure Cloudinary credentials in backend .env before seeding product images.');
  }
  await connectDatabase();
  await seedData(images);
} catch (error) {
  logger.error({ err: error }, 'Seed process failed');
  process.exitCode = 1;
} finally {
  await disconnectDatabase();
}
