import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate.js';
import { quoteController } from '../controllers/quote.controller.js';
import { validate } from '../middlewares/validate.js';
import { quoteSchema } from '../validators/quote.validator.js';
import { commerceController } from '../controllers/commerce.controller.js';
import { cartCouponSchema, cartItemParamsSchema, cartItemSchema } from '../validators/cart.validator.js';
import { couponRateLimiter } from '../middlewares/rateLimiters.js';

const router = Router();

router.use(authenticate);
router.get('/', commerceController.getCart);
router.post('/items', validate(cartItemSchema), commerceController.addCartItem);
router.delete('/items/:itemId', validate(cartItemParamsSchema, 'params'), commerceController.removeCartItem);
router.patch('/coupon', couponRateLimiter, validate(cartCouponSchema), commerceController.setCartCoupon);
router.delete('/', commerceController.clearCart);
router.post('/quote', validate(quoteSchema), quoteController.create);

export default router;
