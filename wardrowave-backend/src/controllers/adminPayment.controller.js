import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { initiateAdminRefund } from '../services/adminPayment.service.js';

function requestContext(req) {
  return { ip: req.ip, userAgent: req.get('user-agent'), requestId: req.id };
}

export const adminPaymentController = {
  refund: asyncHandler(async (req, res) => {
    const result = await initiateAdminRefund({
      paymentId: req.params.paymentId,
      amount: req.body.amount,
      notes: req.body.notes,
      actor: req.user,
      request: requestContext(req),
    });
    ApiResponse.success(res, result);
  }),
};
