import { env } from '../config/env.js';
import { countRentalDays } from '../utils/dates.js';
import { ApiError } from '../utils/ApiError.js';
import { multiplyPaiseByRate, sumPaise } from '../utils/money.js';

function pricingFor(product) {
  return product?.pricing ?? product ?? {};
}

function moneyInteger(value, field) {
  const parsed = Number(value ?? 0);
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new TypeError(`${field} must be a non-negative integer amount in paise`);
  }
  return parsed;
}

function addPaise(values, field) {
  return sumPaise(values, field);
}

function couponEligibility(coupon, { items, subtotal, user, now }) {
  if (!coupon || coupon.isActive === false || coupon.deletedAt) return 'coupon_invalid';
  if (new Date(coupon.startsAt).getTime() > now.getTime()) return 'coupon_invalid';
  if (new Date(coupon.expiresAt).getTime() < now.getTime()) return 'coupon_invalid';
  if (subtotal < Number(coupon.minRentalSubtotal ?? 0)) return 'coupon_invalid';
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) return 'coupon_invalid';
  if (coupon.firstBookingOnly && user?.bookingCount > 0) return 'coupon_invalid';
  if (
    coupon.perUserLimit != null &&
    user?.couponRedemptionCount != null &&
    user.couponRedemptionCount >= coupon.perUserLimit
  ) {
    return 'coupon_invalid';
  }

  const applicableProductIds = (coupon.applicableProducts ?? []).map(String);
  const applicableCategoryIds = (coupon.applicableCategories ?? []).map(String);
  if (applicableProductIds.length || applicableCategoryIds.length) {
    const hasEligibleItem = items.some(({ product }) => (
      (!applicableProductIds.length || applicableProductIds.includes(String(product._id))) &&
      (!applicableCategoryIds.length || applicableCategoryIds.includes(String(product.category?._id ?? product.category)))
    ));
    if (!hasEligibleItem) return 'coupon_invalid';
  }
  return null;
}

/**
 * Calculates the rental charge from persisted product prices in integer paise.
 */
export function calculateRentalCharge(product, rentalDays) {
  if (!Number.isInteger(rentalDays) || rentalDays < 1) {
    throw new TypeError('Rental duration must be a positive whole number');
  }
  const pricing = pricingFor(product);
  const minRentalDays = Number(pricing.minRentalDays ?? 3);
  if (!Number.isInteger(minRentalDays) || minRentalDays < 1) {
    throw new TypeError('Minimum rental duration must be a positive whole number');
  }
  const basePrice = moneyInteger(pricing.basePrice, 'basePrice');
  const extraDayPrice = moneyInteger(pricing.extraDayPrice, 'extraDayPrice');
  return addPaise([
    basePrice,
    multiplyPaiseByRate(extraDayPrice, Math.max(0, rentalDays - minRentalDays)),
  ], 'Rental charge');
}

/**
 * Calculates item-level and order-level rental totals without database access.
 */
export function quote({
  items,
  couponCode,
  coupon = null,
  pincode,
  pincodeServiceable = true,
  user,
  settings = {},
  now = new Date(),
}) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new TypeError('At least one quote item is required');
  }
  const effectiveSettings = {
    gstPercent: settings.gstPercent ?? env.GST_PERCENT,
    deliveryFee: settings.deliveryFee ?? env.DELIVERY_FEE,
    freeDeliveryAbove: settings.freeDeliveryAbove ?? env.FREE_DELIVERY_ABOVE,
  };
  const lines = items.map((item) => {
    const pricing = pricingFor(item.product);
    let rentalDays = 0;
    let dateError = item.dateValid === false ? 'dates_invalid' : null;
    try {
      rentalDays = countRentalDays(item.startDate, item.endDate);
      if (!dateError && rentalDays < Number(pricing.minRentalDays ?? 3)) {
        dateError = 'dates_invalid';
      } else if (!dateError && rentalDays > Number(pricing.maxRentalDays ?? 14)) {
        dateError = 'dates_invalid';
      }
    } catch (error) {
      if (!(error instanceof ApiError)) throw error;
      dateError = 'dates_invalid';
    }

    return {
      productId: item.product?._id,
      variantId: item.variant?._id,
      title: item.product?.title,
      rentalDays,
      rentalCharge: rentalDays ? calculateRentalCharge(item.product, rentalDays) : 0,
      securityDeposit: moneyInteger(pricing.securityDeposit, 'securityDeposit'),
      available: item.available ?? (item.availableCount == null ? null : item.availableCount > 0),
      availableCount: item.availableCount ?? null,
      failureReason: dateError ?? (item.available === false || item.availableCount === 0 ? 'size_unavailable' : null),
    };
  });

  const rentalSubtotal = addPaise(lines.map((line) => line.rentalCharge), 'Rental subtotal');
  let failureReason = lines.find((line) => line.failureReason)?.failureReason ?? null;
  if (!failureReason && pincodeServiceable === false) failureReason = 'pincode_not_serviceable';
  const appliedCoupon = couponCode ? coupon : null;
  let discount = 0;
  if (couponCode) {
    const couponError = couponEligibility(appliedCoupon, { items, subtotal: rentalSubtotal, user, now });
    if (!failureReason && couponError) failureReason = couponError;
    if (!couponError) {
      const eligibleLines = lines.filter((_, index) => {
        const product = items[index].product;
        const products = (coupon.applicableProducts ?? []).map(String);
        const categories = (coupon.applicableCategories ?? []).map(String);
        return (!products.length || products.includes(String(product._id))) &&
          (!categories.length || categories.includes(String(product.category?._id ?? product.category)));
      });
      const discountBase = addPaise(eligibleLines.map((line) => line.rentalCharge), 'Coupon discount base');
      const couponValue = Number(coupon.value);
      if (!Number.isSafeInteger(couponValue) || couponValue < 0) {
        throw new TypeError('Coupon value must be a non-negative whole number');
      }
      if (coupon.type === 'percent' && couponValue > 100) {
        throw new TypeError('Coupon percentage cannot exceed 100');
      }
      const rawDiscount = coupon.type === 'percent'
        ? Number((BigInt(discountBase) * BigInt(couponValue)) / 100n)
        : moneyInteger(coupon.value, 'coupon.value');
      discount = Math.min(
        rentalSubtotal,
        discountBase,
        rawDiscount,
        coupon.maxDiscount == null ? Number.MAX_SAFE_INTEGER : moneyInteger(coupon.maxDiscount, 'coupon.maxDiscount')
      );
    }
  }

  const afterDiscount = rentalSubtotal - discount;
  const freeDeliveryAbove = moneyInteger(effectiveSettings.freeDeliveryAbove, 'freeDeliveryAbove');
  const deliveryFee = afterDiscount >= freeDeliveryAbove
    ? 0
    : moneyInteger(effectiveSettings.deliveryFee, 'deliveryFee');
  const taxableAmount = addPaise([afterDiscount, deliveryFee], 'Taxable amount');
  const gstPercent = Number(effectiveSettings.gstPercent);
  if (!Number.isSafeInteger(gstPercent) || gstPercent < 0 || gstPercent > 100) {
    throw new TypeError('GST percent must be a whole number from 0 to 100');
  }
  const gstAmount = Number((BigInt(taxableAmount) * BigInt(gstPercent) + 50n) / 100n);
  const depositTotal = addPaise(lines.map((line) => line.securityDeposit), 'Security deposit total');

  return {
    items: lines,
    rentalSubtotal,
    discount,
    couponCode: discount > 0 ? coupon.code : undefined,
    deliveryFee,
    taxableAmount,
    gstPercent,
    gstAmount,
    depositTotal,
    grandTotal: addPaise([taxableAmount, gstAmount, depositTotal], 'Grand total'),
    currency: 'INR',
    pincode,
    available: lines.every((line) =>
      line.failureReason !== 'dates_invalid' &&
      line.available !== false &&
      line.availableCount !== 0
    ),
    failureReason,
  };
}

/**
 * Produces a basic rental and delivery quote when no itemized rental line is needed.
 */
export function calculateQuote(product, rentalDays, deliveryFee = 0) {
  const rentalCharge = calculateRentalCharge(product, rentalDays);
  const gstPercent = Number(env.GST_PERCENT);
  if (!Number.isSafeInteger(gstPercent) || gstPercent < 0 || gstPercent > 100) {
    throw new TypeError('GST percent must be a whole number from 0 to 100');
  }
  const taxableAmount = addPaise([rentalCharge, moneyInteger(deliveryFee, 'deliveryFee')], 'Taxable amount');
  const gstAmount = Number((BigInt(taxableAmount) * BigInt(gstPercent) + 50n) / 100n);

  return {
    rentalCharge,
    deliveryFee,
    taxableAmount,
    gstPercent,
    gstAmount,
    total: addPaise([rentalCharge, moneyInteger(deliveryFee, 'deliveryFee'), gstAmount], 'Quote total'),
  };
}
