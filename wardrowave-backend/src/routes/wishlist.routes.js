import { Router } from 'express';
import { commerceController } from '../controllers/commerce.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { validate } from '../middlewares/validate.js';
import { wishlistProductParamsSchema } from '../validators/wishlist.validator.js';

const router = Router();

router.use(authenticate);
router.get('/', commerceController.getWishlist);
router.post('/:productId', validate(wishlistProductParamsSchema, 'params'), commerceController.addWishlistProduct);
router.delete('/:productId', validate(wishlistProductParamsSchema, 'params'), commerceController.removeWishlistProduct);

export default router;
