import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate.js';
import { validate } from '../middlewares/validate.js';
import { paymentController } from '../controllers/payment.controller.js';
import { verifyPaymentSchema } from '../validators/payment.validator.js';
import { paymentVerifyRateLimiter } from '../middlewares/rateLimiters.js';

const router = Router();

router.post('/verify', authenticate, paymentVerifyRateLimiter, validate(verifyPaymentSchema), paymentController.verify);

export default router;
