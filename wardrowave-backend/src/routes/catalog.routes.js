import { Router } from 'express';
import { catalogController } from '../controllers/catalog.controller.js';
import { validate } from '../middlewares/validate.js';
import {
  catalogPrerenderQuerySchema,
  catalogQuerySchema,
} from '../validators/catalog.validator.js';
import {
  availabilityParamsSchema,
  availabilityQuerySchema,
  blockedDatesParamsSchema,
  blockedDatesQuerySchema,
} from '../validators/availability.validator.js';
import { authenticate, optionalAuthenticate } from '../middlewares/authenticate.js';
import { reviewController } from '../controllers/review.controller.js';
import {
  createReviewSchema,
  reviewListQuerySchema,
  reviewProductParamsSchema,
} from '../validators/review.validator.js';
import {
  productSlugParamsSchema,
  similarProductsQuerySchema,
  slugAvailabilityQuerySchema,
} from '../validators/catalog.validator.js';
import { availabilityRateLimiter, reviewRateLimiter } from '../middlewares/rateLimiters.js';
import { uploadMany } from '../middlewares/upload.js';

const router = Router();
router.get('/categories', catalogController.listCategories);
router.get(
  '/prerender/products',
  validate(catalogPrerenderQuerySchema, 'query'),
  catalogController.prerenderProducts
);
router.get('/products', optionalAuthenticate, validate(catalogQuerySchema, 'query'), catalogController.list);
router.get(
  '/products/featured',
  optionalAuthenticate,
  validate(catalogQuerySchema, 'query'),
  catalogController.featured
);
router.get(
  '/products/:slug/availability',
  availabilityRateLimiter,
  validate(productSlugParamsSchema, 'params'),
  validate(slugAvailabilityQuerySchema, 'query'),
  catalogController.slugAvailability
);
router.get(
  '/products/:slug/reviews',
  validate(productSlugParamsSchema, 'params'),
  validate(reviewListQuerySchema, 'query'),
  catalogController.reviewsBySlug
);
router.get(
  '/products/:slug/similar',
  validate(productSlugParamsSchema, 'params'),
  validate(similarProductsQuerySchema, 'query'),
  catalogController.similar
);
router.get(
  '/variants/:variantId/availability',
  availabilityRateLimiter,
  validate(availabilityParamsSchema, 'params'),
  validate(availabilityQuerySchema, 'query'),
  catalogController.availability
);
router.get(
  '/products/:productId/blocked-dates',
  availabilityRateLimiter,
  validate(blockedDatesParamsSchema, 'params'),
  validate(blockedDatesQuerySchema, 'query'),
  catalogController.blockedDates
);
router.get(
  '/products/:productId/reviews',
  validate(reviewProductParamsSchema, 'params'),
  validate(reviewListQuerySchema, 'query'),
  reviewController.list
);
router.post(
  '/products/:productId/reviews',
  authenticate,
  reviewRateLimiter,
  validate(reviewProductParamsSchema, 'params'),
  uploadMany('images', 3),
  validate(createReviewSchema),
  reviewController.create
);
router.get(
  '/products/:slug',
  validate(productSlugParamsSchema, 'params'),
  catalogController.getBySlug
);
export default router;
