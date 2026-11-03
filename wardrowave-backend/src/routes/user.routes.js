import { Router } from 'express';
import { userController } from '../controllers/user.controller.js';
import { wardrobeController } from '../controllers/wardrobe.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { validate } from '../middlewares/validate.js';
import { uploadSingle } from '../middlewares/upload.js';
import { uploadRateLimiter } from '../middlewares/rateLimiters.js';
import {
  addressParamsSchema,
  addressSchemaValidator,
  addressUpdateSchema,
  notificationParamsSchema,
  notificationsQuerySchema,
  profileUpdateSchema,
  wardrobeImageParamsSchema,
} from '../validators/user.validator.js';

const router = Router();

router.use(authenticate);
router.get('/me', userController.getMe);
router.patch('/me', validate(profileUpdateSchema), userController.updateMe);
router.post('/me/avatar', uploadRateLimiter, uploadSingle('avatar'), userController.updateAvatar);
router.get('/me/wardrobe', wardrobeController.list);
router.post(
  '/me/wardrobe',
  uploadRateLimiter,
  uploadSingle('image'),
  wardrobeController.add
);
router.delete(
  '/me/wardrobe/:imageId',
  validate(wardrobeImageParamsSchema, 'params'),
  wardrobeController.remove
);
router.delete('/me', userController.deleteMe);
router.get('/me/notifications', validate(notificationsQuerySchema, 'query'), userController.listNotifications);
router.patch(
  '/me/notifications/:notificationId/read',
  validate(notificationParamsSchema, 'params'),
  userController.markNotificationRead
);
router.post('/me/addresses', validate(addressSchemaValidator), userController.addAddress);
router.patch(
  '/me/addresses/:addressId',
  validate(addressParamsSchema, 'params'),
  validate(addressUpdateSchema),
  userController.updateAddress
);
router.delete('/me/addresses/:addressId', validate(addressParamsSchema, 'params'), userController.deleteAddress);

export default router;
