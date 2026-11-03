import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { verifyFirebaseToken } from '../middlewares/authenticate.js';
import { authSyncRateLimiter } from '../middlewares/rateLimiters.js';
import { validate } from '../middlewares/validate.js';
import { authSyncSchema } from '../validators/auth.validator.js';

const router = Router();

router.post('/sync', authSyncRateLimiter, verifyFirebaseToken, validate(authSyncSchema), authController.sync);

export default router;
