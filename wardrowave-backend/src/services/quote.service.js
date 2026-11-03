import { Booking } from '../models/Booking.js';
import { Coupon } from '../models/Coupon.js';
import { CouponRedemption } from '../models/CouponRedemption.js';
import { ServiceablePincode } from '../models/ServiceablePincode.js';
import { Variant } from '../models/Variant.js';
import { getAvailableUnits } from './availability.service.js';
import { quote as calculateQuote } from './pricing.service.js';
import { getRentalSettings } from './settings.service.js';
import { ApiError } from '../utils/ApiError.js';
import { computeBlockWindow, validateRentalWindow } from '../utils/dates.js';

/**
 * Loads trusted catalog, inventory and policy data and calculates a checkout quote.
 */
export async function createQuote({ items, couponCode, pincode, user }) {
  const settings = await getRentalSettings();
  const quoteItems = [];

  for (const requestedItem of items) {
    const variant = await Variant.findOne({
      _id: requestedItem.variantId,
      isActive: true,
    })
      .populate({
        path: 'product',
        match: { status: 'published', deletedAt: null },
      })
      .lean()
      .exec();
    if (!variant?.product) {
      throw new ApiError(404, 'Product variant not found');
    }

    let dateValid = true;
    let availableUnits = [];
    try {
      const validated = validateRentalWindow(
        requestedItem.startDate,
        requestedItem.endDate,
        variant.product,
        new Date(),
        settings
      );
      const productPricing = variant.product.pricing ?? {};
      const blockWindow = computeBlockWindow(
        validated.startDate,
        validated.endDate,
        productPricing.deliveryBufferDays ?? settings.deliveryBufferDays,
        productPricing.returnBufferDays ?? settings.returnBufferDays
      );
      availableUnits = await getAvailableUnits({
        variantId: variant._id,
        ...blockWindow,
      });
    } catch (error) {
      if (!(error instanceof ApiError) || error.code !== 'INVALID_DATES') throw error;
      dateValid = false;
    }

    quoteItems.push({
      product: variant.product,
      variant,
      startDate: requestedItem.startDate,
      endDate: requestedItem.endDate,
      dateValid,
      available: dateValid ? availableUnits.length > 0 : null,
      availableCount: dateValid ? availableUnits.length : null,
    });
  }

  const coupon = couponCode
    ? await Coupon.findOne({ code: couponCode.toUpperCase(), deletedAt: null }).lean().exec()
    : null;
  const pincodeRecord = await ServiceablePincode.findOne({ pincode, isActive: true }).lean().exec();
  const enrichedUser = user
    ? {
        ...user.toObject?.() ?? user,
        bookingCount: await Booking.countDocuments({ user: user._id, status: { $ne: 'cancelled' } }),
        couponRedemptionCount: coupon
          ? await CouponRedemption.countDocuments({ coupon: coupon._id, user: user._id, reversedAt: null })
          : 0,
      }
    : undefined;

  return calculateQuote({
    items: quoteItems,
    couponCode,
    coupon,
    pincode,
    pincodeServiceable: Boolean(pincodeRecord),
    user: enrichedUser,
    settings,
  });
}
