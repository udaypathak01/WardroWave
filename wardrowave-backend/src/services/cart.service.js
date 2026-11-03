import { Cart } from '../models/Cart.js';
import { Variant } from '../models/Variant.js';
import { ApiError } from '../utils/ApiError.js';
import { validateRentalWindow } from '../utils/dates.js';
import { withTransaction } from '../utils/withTransaction.js';
import { getRentalSettings } from './settings.service.js';

/**
 * Returns a user's saved cart with current product and variant details.
 */
export async function getCart(userId) {
  const cart = await Cart.findOne({ user: userId })
    .populate('items.product', 'title slug images pricing status')
    .populate('items.variant', 'size color sku isActive')
    .lean()
    .exec();
  return cart ?? { items: [], couponCode: null };
}

/**
 * Adds a validated variant and rental period to the authenticated user's cart.
 */
export async function addCartItem({ userId, variantId, startDate, endDate }) {
  const settings = await getRentalSettings();
  return withTransaction(async (session) => {
    const variant = await Variant.findOne({ _id: variantId, isActive: true })
      .populate({ path: 'product', match: { status: 'published', deletedAt: null } })
      .session(session)
      .exec();
    if (!variant?.product) throw new ApiError(404, 'Product variant not found');
    const rental = validateRentalWindow(startDate, endDate, variant.product, new Date(), settings);
    let cart = await Cart.findOne({ user: userId }).session(session).exec();
    if (!cart) {
      [cart] = await Cart.create([{ user: userId, items: [] }], { session });
    }
    const exists = cart.items.some((item) =>
      String(item.variant) === String(variant._id) &&
      item.startDate.getTime() === rental.startDate.getTime() &&
      item.endDate.getTime() === rental.endDate.getTime()
    );
    if (exists) return cart.toJSON();
    if (cart.items.length >= 10) throw new ApiError(409, 'Cart can contain at most 10 items');
    cart.items.push({
      product: variant.product._id,
      variant: variant._id,
      startDate: rental.startDate,
      endDate: rental.endDate,
    });
    await cart.save({ session });
    return cart.toJSON();
  });
}

/**
 * Removes an owned cart item idempotently.
 */
export async function removeCartItem(userId, itemId) {
  const cart = await Cart.findOne({ user: userId }).exec();
  if (!cart) return { items: [], couponCode: null };
  cart.items.pull(itemId);
  await cart.save();
  return cart.toJSON();
}

/**
 * Applies or removes a coupon code from the authenticated user's cart.
 */
export async function setCartCoupon(userId, couponCode) {
  const update = couponCode
    ? { $set: { couponCode: couponCode.trim().toUpperCase() } }
    : { $unset: { couponCode: 1 } };
  const cart = await Cart.findOneAndUpdate(
    { user: userId },
    update,
    { new: true, upsert: true, runValidators: true }
  ).exec();
  return cart.toJSON();
}

/**
 * Clears cart items and the saved coupon.
 */
export async function clearCart(userId) {
  await Cart.updateOne(
    { user: userId },
    { $set: { items: [] }, $unset: { couponCode: 1 } }
  ).exec();
  return { cleared: true };
}
