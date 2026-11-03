import { InventoryUnit } from '../models/InventoryUnit.js';
import { Product } from '../models/Product.js';
import { Variant } from '../models/Variant.js';
import { notifyAdmins } from '../services/notification.service.js';

/**
 * Alerts admins once daily for published variants with no usable inventory units.
 */
export async function alertLowStock(now = new Date()) {
  const variants = await Variant.aggregate([
    { $match: { isActive: true } },
    {
      $lookup: {
        from: InventoryUnit.collection.name,
        let: { variantId: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$variant', '$$variantId'] }, status: { $in: ['available', 'reserved', 'rented'] } } },
          { $count: 'count' },
        ],
        as: 'usableUnits',
      },
    },
    { $set: { usableCount: { $ifNull: [{ $arrayElemAt: ['$usableUnits.count', 0] }, 0] } } },
    { $match: { usableCount: { $lt: 1 } } },
    { $limit: 500 },
  ]).exec();
  const dateKey = now.toISOString().slice(0, 10);
  let alerted = 0;

  for (const variant of variants) {
    const product = await Product.findOne({ _id: variant.product, status: 'published', deletedAt: null })
      .select('title')
      .lean()
      .exec();
    if (!product) continue;
    const variantLabel = [variant.size, variant.color, variant.sku].filter(Boolean).join(' / ');
    await notifyAdmins({
      eventKey: `inventory-low-stock:${variant._id}:${dateKey}`,
      type: 'admin_low_stock',
      title: `Low stock: ${product.title}`,
      body: `No usable inventory units remain for ${variantLabel || 'this variant'}.`,
      data: { productId: product._id, variantId: variant._id, availableCount: variant.usableCount },
      emailTemplate: 'admin-low-stock',
      emailContext: {
        productTitle: product.title,
        variantLabel: variantLabel || 'unspecified',
        availableCount: variant.usableCount,
      },
    });
    alerted += 1;
  }
  return { alerted };
}
