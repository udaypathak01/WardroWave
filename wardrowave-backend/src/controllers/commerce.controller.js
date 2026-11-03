import { addCartItem, clearCart, getCart, removeCartItem, setCartCoupon } from '../services/cart.service.js';
import { addWishlistProduct, getWishlist, removeWishlistProduct } from '../services/wishlist.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const commerceController = {
  /**
   * Reads the authenticated user's cart.
   */
  getCart: asyncHandler(async (req, res) => {
    ApiResponse.success(res, await getCart(req.user._id));
  }),

  /**
   * Adds a validated variant and rental period to the cart.
   */
  addCartItem: asyncHandler(async (req, res) => {
    ApiResponse.success(res, await addCartItem({ userId: req.user._id, ...req.body }), undefined, 201);
  }),

  /**
   * Removes one cart line.
   */
  removeCartItem: asyncHandler(async (req, res) => {
    ApiResponse.success(res, await removeCartItem(req.user._id, req.params.itemId));
  }),

  /**
   * Applies or removes a cart coupon.
   */
  setCartCoupon: asyncHandler(async (req, res) => {
    ApiResponse.success(res, await setCartCoupon(req.user._id, req.body.couponCode));
  }),

  /**
   * Clears all saved cart lines and coupon data.
   */
  clearCart: asyncHandler(async (req, res) => {
    ApiResponse.success(res, await clearCart(req.user._id));
  }),

  /**
   * Reads the authenticated user's wishlist.
   */
  getWishlist: asyncHandler(async (req, res) => {
    ApiResponse.success(res, await getWishlist(req.user._id));
  }),

  /**
   * Adds a published catalog item to the wishlist.
   */
  addWishlistProduct: asyncHandler(async (req, res) => {
    ApiResponse.success(
      res,
      await addWishlistProduct(req.user._id, req.params.productId),
      undefined,
      201
    );
  }),

  /**
   * Removes one product from the wishlist.
   */
  removeWishlistProduct: asyncHandler(async (req, res) => {
    ApiResponse.success(res, await removeWishlistProduct(req.user._id, req.params.productId));
  }),
};
