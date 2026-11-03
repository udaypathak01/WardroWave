import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import {
  getProductBySlug,
  getPincodeServiceability,
  getSlugAvailability,
  listPrerenderProducts,
  listSimilarProducts,
  listActiveCategories,
  listPublishedProducts,
} from '../services/catalog.service.js';
import {
  getAvailabilityCount,
  getBlockedDateRanges,
  getNextAvailableDate,
} from '../services/availability.service.js';
import { countRentalDays } from '../utils/dates.js';
import { listProductReviewsBySlug } from '../services/review.service.js';
import { ApiError } from '../utils/ApiError.js';

export const catalogController = {
  listCategories: asyncHandler(async (req, res) => {
    ApiResponse.success(res, await listActiveCategories());
  }),

  list: asyncHandler(async (req, res) => {
    const result = await listPublishedProducts({ ...req.query, userId: req.user?._id });
    ApiResponse.success(res, result.items, result.meta, 200);
  }),

  prerenderProducts: asyncHandler(async (req, res) => {
    const result = await listPrerenderProducts(req.query);
    ApiResponse.success(res, result.items, result.meta, 200);
  }),

  featured: asyncHandler(async (req, res) => {
    const result = await listPublishedProducts({
      ...req.query,
      sort: 'featured',
      userId: req.user?._id,
    });
    ApiResponse.success(res, result.items, result.meta);
  }),

  getBySlug: asyncHandler(async (req, res) => {
    const product = await getProductBySlug(req.params.slug);
    if (!product) throw new ApiError(404, 'Product not found', 'NOT_FOUND');
    ApiResponse.success(res, product, undefined, 200);
  }),

  availability: asyncHandler(async (req, res) => {
    const { variantId } = req.params;
    const { startDate, endDate } = req.query;
    const availableCount = await getAvailabilityCount(variantId, startDate, endDate);
    const nextAvailableDate = availableCount === 0
      ? await getNextAvailableDate(variantId, startDate, countRentalDays(startDate, endDate))
      : null;
    ApiResponse.success(res, {
      availableCount: Math.min(availableCount, 2),
      available: availableCount > 0,
      nextAvailableDate,
    }, undefined, 200);
  }),

  blockedDates: asyncHandler(async (req, res) => {
    const ranges = await getBlockedDateRanges(
      req.params.productId,
      req.query.variantId,
      req.query.fromDate,
      req.query.toDate
    );
    ApiResponse.success(res, ranges, undefined, 200);
  }),

  slugAvailability: asyncHandler(async (req, res) => {
    ApiResponse.success(res, await getSlugAvailability(req.params.slug, req.query));
  }),

  reviewsBySlug: asyncHandler(async (req, res) => {
    const result = await listProductReviewsBySlug(req.params.slug, req.query);
    ApiResponse.success(res, result.items, result.meta);
  }),

  similar: asyncHandler(async (req, res) => {
    ApiResponse.success(res, await listSimilarProducts(req.params.slug, req.query));
  }),

  pincodeServiceability: asyncHandler(async (req, res) => {
    ApiResponse.success(res, await getPincodeServiceability(req.params.pincode));
  }),
};
