/**
 * WardroWave - Firebase Firestore Seed Script
 * Usage: node scripts/seed.js
 * Seeds products collection with initial data from the frontend's productsData.js catalog
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { initFirebase, getDB } = require('../config/firebase');

initFirebase();
const db = getDB();

const fs = require('fs');
const fileContent = fs.readFileSync(require('path').resolve(__dirname, '../../src/data/productsData.js'), 'utf8');
const arrayStr = fileContent.match(/export const RENTAL_ITEMS = (\[[\s\S]*?\]);/)[1];
const RAW_PRODUCTS = eval(arrayStr);

const PRODUCTS = RAW_PRODUCTS.map(item => ({
  name: item.name,
  type: item.type || 'accessories',
  color: item.color || 'Assorted',
  rentalPrice: item.rentalPrice,
  originalPrice: item.originalPrice || item.rentalPrice * 4,
  rating: item.rating,
  reviewCount: item.reviews || 0,
  category: item.category,
  duration: item.duration || 3,
  images: item.images ? item.images : (item.image ? [{ url: item.image, isPrimary: true }] : []),
  inStock: item.inStock,
  tags: [item.category, item.type, item.color, "fashion"]
}));

const seed = async () => {
  console.log('\n🌱 Starting Firestore seed...\n');

  // Clear existing products
  const existingSnap = await db.collection('products').get();
  if (!existingSnap.empty) {
    const batch = db.batch();
    existingSnap.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    console.log(`🗑️  Deleted ${existingSnap.size} existing products`);
  }

  // Insert products in batches (Firestore limit: 500 per batch)
  const BATCH_SIZE = 100;
  let seeded = 0;

  for (let i = 0; i < PRODUCTS.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = PRODUCTS.slice(i, i + BATCH_SIZE);

    chunk.forEach(product => {
      // Enforce 5% to 10% rental pricing model
      const minPrice = Math.ceil(product.originalPrice * 0.05);
      const maxPrice = Math.floor(product.originalPrice * 0.10);
      const calcRentalPrice = Math.floor(Math.random() * (maxPrice - minPrice + 1)) + minPrice;

      const ref = db.collection('products').doc();
      batch.set(ref, {
        ...product,
        rentalPrice: calcRentalPrice,
        reviews: [],
        totalRentals: 0,
        totalEarnings: 0,
        stockQuantity: 1,
        isActive: true,
        owner: null,
        ownerName: 'WardroWave',
        qrCode: `WW-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      seeded++;
    });

    await batch.commit();
    console.log(`  ✅ Seeded batch: ${seeded} / ${PRODUCTS.length} products`);
  }

  console.log(`\n✅ Seed complete! ${seeded} products added to Firestore.\n`);
  process.exit(0);
};

seed().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
