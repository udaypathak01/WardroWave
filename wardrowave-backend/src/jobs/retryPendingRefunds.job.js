import { Refund } from '../models/Refund.js';
import { submitRefund } from '../services/payment.service.js';

/**
 * Retries pending refunds after their ten-minute delay and escalates after five attempts.
 */
export async function retryPendingRefunds(now = new Date()) {
  const retryBefore = new Date(now.getTime() - 10 * 60_000);
  const refunds = await Refund.find({
    status: 'pending',
    razorpayRefundId: { $exists: false },
    submissionAttempts: { $lt: 5 },
    $or: [
      { lastAttemptAt: { $exists: false }, createdAt: { $lte: retryBefore } },
      { lastAttemptAt: { $lte: retryBefore } },
    ],
  })
    .sort({ createdAt: 1 })
    .limit(100)
    .select('_id')
    .lean()
    .exec();

  let attempted = 0;
  for (const refund of refunds) {
    const result = await submitRefund(refund._id);
    if (result) attempted += 1;
  }
  return { attempted };
}
