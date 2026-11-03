import { env } from '../config/env.js';
import { getRentalSettings } from '../services/settings.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const cancellationPolicy = (freeCancelHours) =>
  `Cancel at least ${freeCancelHours} hours before rental start for a full rental-charge and deposit refund. Later cancellations retain 50% of the rental charge; the security deposit is refunded.`;

/**
 * Returns public rental settings and payment configuration needed by the storefront.
 */
export async function getPublicConfig(req, res, next) {
  try {
    const settings = await getRentalSettings();
    ApiResponse.success(res, {
      minRentalDays: settings.minRentalDays,
      maxRentalDays: settings.maxRentalDays,
      minLeadDays: settings.minLeadDays,
      maxAdvanceDays: settings.maxAdvanceDays,
      gstPercent: settings.gstPercent,
      deliveryFee: settings.deliveryFee,
      freeDeliveryAbove: settings.freeDeliveryAbove,
      freeCancelHours: settings.freeCancelHours,
      cancellationPolicy: cancellationPolicy(settings.freeCancelHours),
      razorpayKeyId: env.RAZORPAY_KEY_ID ?? null,
      supportEmail: env.SUPPORT_EMAIL,
    });
  } catch (error) {
    next(error);
  }
}
