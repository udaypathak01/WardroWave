import Razorpay from 'razorpay';
import { env } from './env.js';
import { ApiError } from '../utils/ApiError.js';

let razorpayInstance;

/**
 * Returns the singleton Razorpay client, failing explicitly if credentials are absent.
 */
export function getRazorpay() {
  if (razorpayInstance) return razorpayInstance;
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new ApiError(503, 'Payment provider is not configured');
  }
  razorpayInstance = new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
  });
  return razorpayInstance;
}
