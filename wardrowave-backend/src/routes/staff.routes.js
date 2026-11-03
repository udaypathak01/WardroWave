import { Router } from 'express';
import { staffController } from '../controllers/staff.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import {
  authorize,
  requireRecentAuth,
  requireVerifiedAdminWhenPresent,
} from '../middlewares/authorize.js';
import { adminSensitiveRateLimiter } from '../middlewares/rateLimiters.js';
import { validate } from '../middlewares/validate.js';
import { bookingParamsSchema } from '../validators/availability.validator.js';
import {
  dispatchSchema,
  inspectionSchema,
  inventoryUnitParamsSchema,
  receiveReturnSchema,
} from '../validators/fulfillment.validator.js';

const router = Router();

router.use(authenticate, authorize('staff', 'admin'), requireVerifiedAdminWhenPresent);
router.post('/bookings/:id/dispatch', validate(bookingParamsSchema, 'params'), validate(dispatchSchema), staffController.dispatch);
router.post('/bookings/:id/deliver', validate(bookingParamsSchema, 'params'), staffController.deliver);
router.post('/bookings/:id/receive', validate(bookingParamsSchema, 'params'), validate(receiveReturnSchema), staffController.receive);
router.post(
  '/bookings/:id/inspect',
  validate(bookingParamsSchema, 'params'),
  validate(inspectionSchema),
  adminSensitiveRateLimiter,
  requireRecentAuth,
  staffController.inspect
);
router.post('/inventory/:unitId/clean', validate(inventoryUnitParamsSchema, 'params'), staffController.markClean);

export default router;
