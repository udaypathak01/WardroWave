import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { acceptRazorpayWebhook } from '../services/payment.service.js';

export const webhookController = {
  /**
   * Persists and acknowledges a Razorpay webhook after verifying its raw-body signature.
   */
  razorpay: asyncHandler(async (req, res) => {
    const result = await acceptRazorpayWebhook({
      rawBody: req.body,
      signature: req.get('X-Razorpay-Signature'),
      eventId: req.get('X-Razorpay-Event-Id'),
    });
    ApiResponse.success(res, result, undefined, 200);
  }),
};
