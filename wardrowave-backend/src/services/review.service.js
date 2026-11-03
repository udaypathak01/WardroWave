import mongoose from 'mongoose';
import { Booking } from '../models/Booking.js';
import { Product } from '../models/Product.js';
import { Review } from '../models/Review.js';
import { ApiError } from '../utils/ApiError.js';
import { withTransaction } from '../utils/withTransaction.js';
import { writeAuditLog } from './audit.service.js';
import { deleteMany, uploadBuffer } from './upload.service.js';
import { env } from '../config/env.js';

/**
 * Creates a pending review only for a product rented in the customer's completed booking.
 */
export async function createReview({ userId, productId, input, files = [] }) {
  if ((input.images?.length ?? 0) + files.length > 3) {
    throw new ApiError(422, 'A review can include at most 3 images', 'VALIDATION_ERROR');
  }
  const eligibleBooking = await Booking.exists({
      _id: input.bookingId,
      user: userId,
      status: 'completed',
      'items.product': productId,
    });
  if (!eligibleBooking) throw new ApiError(403, 'A completed booking containing this product is required');

  const reviewId = new mongoose.Types.ObjectId();
  const uploaded = [];
  try {
    for (const file of files) {
      uploaded.push(await uploadBuffer(file.buffer, {
        folder: `${env.CLOUDINARY_FOLDER}/reviews/${reviewId}`,
        publicIdPrefix: 'review',
      }));
    }

    return await withTransaction(async (session) => {
      const booking = await Booking.findOne({
        _id: input.bookingId,
        user: userId,
        status: 'completed',
        'items.product': productId,
      }).session(session).exec();
      if (!booking) throw new ApiError(403, 'A completed booking containing this product is required');
      const [review] = await Review.create(
        [{
          _id: reviewId,
          product: productId,
          booking: booking._id,
          user: userId,
          rating: input.rating,
          title: input.title,
          comment: input.comment,
          fitFeedback: input.fitFeedback,
          images: [...(input.images ?? []), ...uploaded.map((image) => image.url)],
        }],
        { session }
      );
      return review.toJSON();
    });
  } catch (error) {
    await deleteMany(uploaded.map((image) => image.publicId));
    throw error;
  }
}

/**
 * Lists approved reviews for a published product with pagination.
 */
export async function listProductReviews(productId, { page, limit }) {
  const product = await Product.exists({ _id: productId, status: 'published', deletedAt: null });
  if (!product) throw new ApiError(404, 'Product not found');
  const filter = { product: productId, status: 'approved' };
  const [items, total] = await Promise.all([
    Review.find(filter)
      .populate('user', 'name avatar')
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()
      .exec(),
    Review.countDocuments(filter).exec(),
  ]);
  const [ratingCounts, fitCounts] = await Promise.all([
    Review.aggregate([
      { $match: filter },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
    ]).exec(),
    Review.aggregate([
      { $match: { ...filter, fitFeedback: { $exists: true } } },
      { $group: { _id: '$fitFeedback', count: { $sum: 1 } } },
    ]).exec(),
  ]);
  return {
    items,
    meta: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      ratingHistogram: Object.fromEntries(ratingCounts.map(({ _id, count }) => [_id, count])),
      fitFeedback: Object.fromEntries(fitCounts.map(({ _id, count }) => [_id, count])),
    },
  };
}

/**
 * Lists approved reviews for a published product addressed by its public slug.
 */
export async function listProductReviewsBySlug(slug, pagination) {
  const identifier = mongoose.isValidObjectId(slug) ? { _id: slug } : { slug };
  const product = await Product.findOne({
    ...identifier,
    status: 'published',
    deletedAt: null,
  })
    .select('_id')
    .lean()
    .exec();
  if (!product) throw new ApiError(404, 'Product not found');
  return listProductReviews(product._id, pagination);
}

async function updateProductRating(productId, session) {
  const [summary] = await Review.aggregate([
    { $match: { product: productId, status: 'approved' } },
    { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]).session(session);
  await Product.updateOne(
    { _id: productId },
    { $set: { ratingAvg: summary?.average ?? 0, ratingCount: summary?.count ?? 0 } },
    { session }
  ).exec();
}

/**
 * Moderates a review and recalculates its product's approved rating summary.
 */
export async function moderateReview({ reviewId, status, actor, request }) {
  return withTransaction(async (session) => {
    const review = await Review.findById(reviewId).session(session).exec();
    if (!review) throw new ApiError(404, 'Review not found');
    const previousStatus = review.status;
    review.status = status;
    await review.save({ session });
    await updateProductRating(review.product, session);
    await writeAuditLog({
      actor: actor._id,
      actorRole: actor.role,
      action: 'review.moderated',
      entityType: 'Review',
      entityId: review._id,
      summary: { before: previousStatus, after: status },
      ip: request.ip,
      userAgent: request.userAgent,
      requestId: request.requestId,
      session,
    });
    return review.toJSON();
  });
}
