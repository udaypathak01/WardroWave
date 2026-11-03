import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { verifyPayment } from '../services/payment.service.js';

export const paymentController = {
  /**
   * Verifies the client payment signature and confirms the captured payment.
   */
  verify: asyncHandler(async (req, res) => {
    const result = await verifyPayment({
      userId: req.user._id,
      orderId: req.body.razorpay_order_id,
      paymentId: req.body.razorpay_payment_id,
      signature: req.body.razorpay_signature,
    });
    ApiResponse.success(res, result, undefined, 200);
  }),
};
