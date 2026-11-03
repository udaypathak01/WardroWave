import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import {
  archiveProduct,
  createCategory,
  updateCategory,
  addProductImages,
  reorderProductImages,
  removeProductImage,
  createProduct,
  createVariant,
  updateInventoryStatus,
  updateProduct,
} from '../services/adminCatalog.service.js';
import { createCatalogUploadSignature } from '../services/upload.service.js';
import { createCoupon, updateCoupon } from '../services/adminCoupon.service.js';
import { getOperationsReport } from '../services/report.service.js';
import {
  readAdminSettings,
  updateAdminSettings,
  updateServiceablePincode,
} from '../services/adminSettings.service.js';

function requestContext(req) {
  return { ip: req.ip, userAgent: req.get('user-agent'), requestId: req.id };
}

export const adminCatalogController = {
  /**
   * Creates a catalog product.
   */
  createProduct: asyncHandler(async (req, res) => {
    const result = await createProduct({ actor: req.user, input: req.body, request: requestContext(req) });
    ApiResponse.success(res, result, undefined, 201);
  }),

  /**
   * Updates a catalog product and its validated price configuration.
   */
  updateProduct: asyncHandler(async (req, res) => {
    const result = await updateProduct({
      productId: req.params.productId,
      actor: req.user,
      input: req.body,
      request: requestContext(req),
    });
    ApiResponse.success(res, result);
  }),

  /**
   * Archives a product without deleting historical rental records.
   */
  archiveProduct: asyncHandler(async (req, res) => {
    const result = await archiveProduct({
      productId: req.params.productId,
      actor: req.user,
      request: requestContext(req),
    });
    ApiResponse.success(res, result);
  }),

  /**
   * Creates a product category.
   */
  createCategory: asyncHandler(async (req, res) => {
    const result = await createCategory({ actor: req.user, input: req.body, request: requestContext(req) });
    ApiResponse.success(res, result, undefined, 201);
  }),

  /**
   * Updates category details or its parent relationship.
   */
  updateCategory: asyncHandler(async (req, res) => {
    const result = await updateCategory({
      categoryId: req.params.categoryId,
      actor: req.user,
      input: req.body,
      request: requestContext(req),
    });
    ApiResponse.success(res, result);
  }),

  /**
   * Adds a product variant and the corresponding physical inventory units.
   */
  createVariant: asyncHandler(async (req, res) => {
    const result = await createVariant({
      productId: req.params.productId,
      actor: req.user,
      input: req.body,
      request: requestContext(req),
    });
    ApiResponse.success(res, result, undefined, 201);
  }),

  /**
   * Moves an available inventory unit to or from maintenance or retirement.
   */
  updateInventoryStatus: asyncHandler(async (req, res) => {
    const result = await updateInventoryStatus({
      unitId: req.params.unitId,
      status: req.body.status,
      actor: req.user,
      request: requestContext(req),
    });
    ApiResponse.success(res, result);
  }),

  /**
   * Returns signed parameters for a direct catalog image upload.
   */
  signUpload: asyncHandler(async (req, res) => {
    ApiResponse.success(res, createCatalogUploadSignature(req.params.productId));
  }),

  /**
   * Uploads and attaches product images to a catalog entry.
   */
  addProductImages: asyncHandler(async (req, res) => {
    const result = await addProductImages({
      productId: req.params.productId,
      actor: req.user,
      files: req.files ?? [],
      request: requestContext(req),
    });
    ApiResponse.success(res, result);
  }),

  /**
   * Reorders product images and selects the primary image.
   */
  reorderProductImages: asyncHandler(async (req, res) => {
    const result = await reorderProductImages({
      productId: req.params.productId,
      ...req.body,
      actor: req.user,
      request: requestContext(req),
    });
    ApiResponse.success(res, result);
  }),

  /**
   * Removes a product image from catalog storage.
   */
  removeProductImage: asyncHandler(async (req, res) => {
    const result = await removeProductImage({
      productId: req.params.productId,
      ...req.body,
      actor: req.user,
      request: requestContext(req),
    });
    ApiResponse.success(res, result);
  }),

  /**
   * Creates a coupon with validated product and category scopes.
   */
  createCoupon: asyncHandler(async (req, res) => {
    const result = await createCoupon({ actor: req.user, input: req.body, request: requestContext(req) });
    ApiResponse.success(res, result, undefined, 201);
  }),

  /**
   * Updates an existing coupon's mutable configuration.
   */
  updateCoupon: asyncHandler(async (req, res) => {
    const result = await updateCoupon({
      couponId: req.params.couponId,
      actor: req.user,
      input: req.body,
      request: requestContext(req),
    });
    ApiResponse.success(res, result);
  }),

  /**
   * Returns the current effective rental settings.
   */
  getSettings: asyncHandler(async (req, res) => {
    ApiResponse.success(res, await readAdminSettings());
  }),

  /**
   * Updates validated runtime pricing and rental policies.
   */
  updateSettings: asyncHandler(async (req, res) => {
    const result = await updateAdminSettings({
      input: req.body,
      actor: req.user,
      request: requestContext(req),
    });
    ApiResponse.success(res, result);
  }),

  /**
   * Creates or updates a serviceable delivery pincode.
   */
  updatePincode: asyncHandler(async (req, res) => {
    const result = await updateServiceablePincode({
      pincode: req.params.pincode,
      input: req.body,
      actor: req.user,
      request: requestContext(req),
    });
    ApiResponse.success(res, result);
  }),

  /**
   * Returns operational totals for the requested IST calendar-date range.
   */
  report: asyncHandler(async (req, res) => {
    ApiResponse.success(res, await getOperationsReport(req.query));
  }),
};
