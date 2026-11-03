import { Product } from '../models/Product.js';
import { Wishlist } from '../models/Wishlist.js';
import { ApiError } from '../utils/ApiError.js';
import { withTransaction } from '../utils/withTransaction.js';

/**
 * Returns the user's wishlist populated with currently published products.
 */
export async function getWishlist(userId) {
  const wishlist = await Wishlist.findOne({ user: userId })
    .populate({ path: 'products', match: { status: 'published', deletedAt: null } })
    .lean()
    .exec();
  return wishlist ?? { products: [] };
}

/**
 * Adds one published product to the user's wishlist without duplicates.
 */
export async function addWishlistProduct(userId, productId) {
  return withTransaction(async (session) => {
    const productExists = await Product.exists({
      _id: productId,
      status: 'published',
      deletedAt: null,
    }).session(session);
    if (!productExists) throw new ApiError(404, 'Product not found');
    let wishlist = await Wishlist.findOne({ user: userId }).session(session).exec();
    if (!wishlist) {
      [wishlist] = await Wishlist.create([{ user: userId, products: [] }], { session });
    }
    if (!wishlist.products.some((id) => String(id) === String(productId))) {
      if (wishlist.products.length >= 200) throw new ApiError(409, 'Wishlist can contain at most 200 products');
      wishlist.products.push(productId);
      await wishlist.save({ session });
    }
    return wishlist.toJSON();
  });
}

/**
 * Removes one product from the authenticated user's wishlist.
 */
export async function removeWishlistProduct(userId, productId) {
  await Wishlist.updateOne({ user: userId }, { $pull: { products: productId } }).exec();
  return { removed: true };
}
