import { Router } from 'express';
import authRoutes from './auth.routes.js';
import catalogRoutes from './catalog.routes.js';
import bookingRoutes from './booking.routes.js';
import cartRoutes from './cart.routes.js';
import paymentRoutes from './payment.routes.js';
import webhookRoutes from './webhook.routes.js';
import userRoutes from './user.routes.js';
import adminRoutes from './admin.routes.js';
import staffRoutes from './staff.routes.js';
import wishlistRoutes from './wishlist.routes.js';
import contactRoutes from './contact.routes.js';
import { getPublicConfig } from '../controllers/meta.controller.js';
import { catalogController } from '../controllers/catalog.controller.js';
import { validate } from '../middlewares/validate.js';
import { optionalAuthenticate } from '../middlewares/authenticate.js';
import {
  catalogQuerySchema,
  pincodeParamsSchema,
  productSlugParamsSchema,
  similarProductsQuerySchema,
  slugAvailabilityQuerySchema,
} from '../validators/catalog.validator.js';
import { reviewListQuerySchema } from '../validators/review.validator.js';
import { availabilityRateLimiter } from '../middlewares/rateLimiters.js';

const router = Router();
router.use('/auth', authRoutes);
router.use('/catalog', catalogRoutes);
router.use('/bookings', bookingRoutes);
router.use('/cart', cartRoutes);
router.use('/payments', paymentRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);
router.use('/staff', staffRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/contact', contactRoutes);
router.get('/meta/config', getPublicConfig);
router.get('/categories', catalogController.listCategories);
router.get(
  '/products',
  optionalAuthenticate,
  validate(catalogQuerySchema, 'query'),
  catalogController.list
);
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
  '/products/:slug',
  validate(productSlugParamsSchema, 'params'),
  catalogController.getBySlug
);
router.get(
  '/pincodes/:pincode/serviceable',
  validate(pincodeParamsSchema, 'params'),
  catalogController.pincodeServiceability
);

export default router;
