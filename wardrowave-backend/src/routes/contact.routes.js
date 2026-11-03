import { Router } from 'express';
import { contactController } from '../controllers/contact.controller.js';
import { contactRateLimiter } from '../middlewares/rateLimiters.js';
import { validate } from '../middlewares/validate.js';
import { contactMessageSchema } from '../validators/contact.validator.js';

const router = Router();

router.post('/', contactRateLimiter, validate(contactMessageSchema), contactController.submit);

export default router;
