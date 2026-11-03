import { createReview, listProductReviews, moderateReview } from '../services/review.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const reviewController = {
  /**
   * Lists only approved reviews for a catalog product.
   */
  list: asyncHandler(async (req, res) => {
    const result = await listProductReviews(req.params.productId, req.query);
    ApiResponse.success(res, result.items, result.meta);
  }),

  /**
   * Creates a review from a completed rental.
   */
  create: asyncHandler(async (req, res) => {
    const result = await createReview({
      userId: req.user._id,
      productId: req.params.productId,
      input: req.body,
      files: req.files ?? [],
    });
    ApiResponse.success(res, result, undefined, 201);
  }),

  /**
   * Approves or rejects a pending review.
   */
  moderate: asyncHandler(async (req, res) => {
    const result = await moderateReview({
      reviewId: req.params.reviewId,
      status: req.body.status,
      actor: req.user,
      request: { ip: req.ip, userAgent: req.get('user-agent'), requestId: req.id },
    });
    ApiResponse.success(res, result);
  }),
};
