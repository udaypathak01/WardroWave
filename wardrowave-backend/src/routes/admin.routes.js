import { Router } from 'express';
import { userController } from '../controllers/user.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import {
  authorize,
  requireMfa,
  requireRecentAuth,
  requireSuperadmin,
  requireUserAccessTier,
  requireVerifiedAdmin,
} from '../middlewares/authorize.js';
import { validate } from '../middlewares/validate.js';
import { userAccessSchema, userParamsSchema } from '../validators/user.validator.js';
import { adminCatalogController } from '../controllers/adminCatalog.controller.js';
import {
  adminProductParamsSchema,
  adminCategoryParamsSchema,
  adminUnitParamsSchema,
  categoryCreateSchema,
  categoryUpdateSchema,
  inventoryStatusSchema,
  productCreateSchema,
  productImageDeleteSchema,
  productImageOrderSchema,
  productUpdateSchema,
  variantCreateSchema,
} from '../validators/adminCatalog.validator.js';
import { couponCreateSchema, couponParamsSchema, couponUpdateSchema } from '../validators/adminCoupon.validator.js';
import {
  pincodeParamsSchema,
  pincodeUpdateSchema,
  settingsUpdateSchema,
} from '../validators/adminSettings.validator.js';
import { reportQuerySchema } from '../validators/report.validator.js';
import { reviewController } from '../controllers/review.controller.js';
import { reviewModerationSchema, reviewParamsSchema } from '../validators/review.validator.js';
import {
  adminRateLimiter,
  adminSensitiveRateLimiter,
  couponRateLimiter,
  uploadRateLimiter,
} from '../middlewares/rateLimiters.js';
import { uploadMany } from '../middlewares/upload.js';
import { adminReadController } from '../controllers/adminRead.controller.js';
import { adminPaymentController } from '../controllers/adminPayment.controller.js';
import { adminRefundSchema } from '../validators/adminPayment.validator.js';
import {
  adminAuditLogsQuerySchema,
  adminBookingsQuerySchema,
  adminCategoriesQuerySchema,
  adminCouponIdParamsSchema,
  adminCouponsQuerySchema,
  adminCustomersQuerySchema,
  adminIdParamsSchema,
  adminPaymentIdParamsSchema,
  adminPaymentsQuerySchema,
  adminInventoryQuerySchema,
  adminProductIdParamsSchema,
  adminProductsQuerySchema,
  adminReviewsQuerySchema,
} from '../validators/adminRead.validator.js';

const router = Router();

router.use(authenticate, authorize('admin'), requireVerifiedAdmin, adminRateLimiter);
router.get('/dashboard', adminReadController.dashboard);
router.get('/bookings', validate(adminBookingsQuerySchema, 'query'), adminReadController.bookings);
router.get('/bookings/:id', validate(adminIdParamsSchema, 'params'), adminReadController.booking);
router.get('/customers', validate(adminCustomersQuerySchema, 'query'), adminReadController.customers);
router.get('/customers/:id', validate(adminIdParamsSchema, 'params'), adminReadController.customer);
router.get('/products', validate(adminProductsQuerySchema, 'query'), adminReadController.products);
router.get(
  '/products/:productId',
  validate(adminProductIdParamsSchema, 'params'),
  adminReadController.product
);
router.get('/categories', validate(adminCategoriesQuerySchema, 'query'), adminReadController.categories);
router.get('/inventory', validate(adminInventoryQuerySchema, 'query'), adminReadController.inventory);
router.get('/payments', validate(adminPaymentsQuerySchema, 'query'), adminReadController.payments);
router.post(
  '/payments/:paymentId/refunds',
  adminSensitiveRateLimiter,
  requireRecentAuth,
  validate(adminPaymentIdParamsSchema, 'params'),
  validate(adminRefundSchema),
  adminPaymentController.refund
);
router.get('/coupons', validate(adminCouponsQuerySchema, 'query'), adminReadController.coupons);
router.get(
  '/coupons/:couponId',
  validate(adminCouponIdParamsSchema, 'params'),
  adminReadController.coupon
);
router.get('/reviews', validate(adminReviewsQuerySchema, 'query'), adminReadController.reviews);
router.get('/audit-logs', validate(adminAuditLogsQuerySchema, 'query'), adminReadController.auditLogs);
router.patch(
  '/users/:id/access',
  validate(userParamsSchema, 'params'),
  validate(userAccessSchema),
  adminSensitiveRateLimiter,
  requireUserAccessTier,
  userController.updateAccess
);
router.delete(
  '/users/:id',
  validate(userParamsSchema, 'params'),
  adminSensitiveRateLimiter,
  requireRecentAuth,
  userController.deleteCustomer
);
router.post('/products', validate(productCreateSchema), adminCatalogController.createProduct);
router.post(
  '/products/:productId/images',
  uploadRateLimiter,
  validate(adminProductParamsSchema, 'params'),
  uploadMany('images', 8),
  adminCatalogController.addProductImages
);
router.patch(
  '/products/:productId/images',
  validate(adminProductParamsSchema, 'params'),
  validate(productImageOrderSchema),
  adminCatalogController.reorderProductImages
);
router.delete(
  '/products/:productId/images',
  validate(adminProductParamsSchema, 'params'),
  validate(productImageDeleteSchema),
  adminCatalogController.removeProductImage
);
router.post(
  '/products/:productId/upload-signature',
  uploadRateLimiter,
  validate(adminProductParamsSchema, 'params'),
  adminCatalogController.signUpload
);
router.patch(
  '/products/:productId',
  validate(adminProductParamsSchema, 'params'),
  validate(productUpdateSchema),
  adminCatalogController.updateProduct
);
router.delete(
  '/products/:productId',
  validate(adminProductParamsSchema, 'params'),
  adminSensitiveRateLimiter,
  requireRecentAuth,
  adminCatalogController.archiveProduct
);
router.post('/products/:productId/variants',
  validate(adminProductParamsSchema, 'params'),
  validate(variantCreateSchema),
  adminCatalogController.createVariant
);
router.post('/categories', validate(categoryCreateSchema), adminCatalogController.createCategory);
router.patch(
  '/categories/:categoryId',
  validate(adminCategoryParamsSchema, 'params'),
  validate(categoryUpdateSchema),
  adminCatalogController.updateCategory
);
router.patch(
  '/inventory/:unitId/status',
  validate(adminUnitParamsSchema, 'params'),
  validate(inventoryStatusSchema),
  (req, res, next) => {
    if (req.body.status !== 'retired') return next();
    return adminSensitiveRateLimiter(req, res, (error) => {
      if (error) return next(error);
      return requireRecentAuth(req, res, next);
    });
  },
  adminCatalogController.updateInventoryStatus
);
router.post('/uploads/catalog-signature', uploadRateLimiter, adminCatalogController.signUpload);
router.post('/coupons', couponRateLimiter, validate(couponCreateSchema), adminCatalogController.createCoupon);
router.patch(
  '/coupons/:couponId',
  validate(couponParamsSchema, 'params'),
  validate(couponUpdateSchema),
  adminCatalogController.updateCoupon
);
router.get('/settings', adminCatalogController.getSettings);
router.patch(
  '/settings',
  adminSensitiveRateLimiter,
  requireSuperadmin,
  requireRecentAuth,
  requireMfa,
  validate(settingsUpdateSchema),
  adminCatalogController.updateSettings
);
router.put(
  '/pincodes/:pincode',
  validate(pincodeParamsSchema, 'params'),
  validate(pincodeUpdateSchema),
  adminCatalogController.updatePincode
);
router.get('/reports/summary', validate(reportQuerySchema, 'query'), adminCatalogController.report);
router.patch(
  '/reviews/:reviewId/moderation',
  validate(reviewParamsSchema, 'params'),
  validate(reviewModerationSchema),
  reviewController.moderate
);

export default router;
