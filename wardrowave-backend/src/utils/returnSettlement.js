import { differenceInDays } from './dates.js';
import { multiplyPaiseByRate, sumPaise } from './money.js';
import { ApiError } from './ApiError.js';

/**
 * Calculates late fees, damage deductions, and the refundable deposit in integer paise.
 */
export function calculateReturnSettlement({
  bookingItems,
  assessments,
  products,
  receivedAt,
  lateFeeMultiplier,
  depositTotal,
}) {
  if (!Array.isArray(bookingItems) || bookingItems.length === 0 || !Array.isArray(assessments)) {
    throw new TypeError('Booking items and inspection assessments are required');
  }
  if (!Number.isSafeInteger(depositTotal) || depositTotal < 0) {
    throw new TypeError('Security deposit must be a non-negative safe integer in paise');
  }
  const productById = new Map(products.map((product) => [String(product._id), product]));
  const assessmentById = new Map(assessments.map((assessment) => [String(assessment.itemId), assessment]));
  if (assessmentById.size !== assessments.length || assessments.length !== bookingItems.length) {
    throw new ApiError(400, 'Provide exactly one assessment for every booking item');
  }

  let totalLateFee = 0;
  let totalDamageCharge = 0;
  let maxLateDays = 0;
  let damageLevel = 'none';
  const severity = { none: 0, minor: 1, major: 2, lost: 3 };
  const notes = [];
  const photos = [];

  for (const item of bookingItems) {
    const assessment = assessmentById.get(String(item._id));
    const product = productById.get(String(item.product));
    if (!assessment) throw new ApiError(400, 'Assessment item does not match this booking');
    if (!product) throw new ApiError(409, 'A booking product could not be loaded for inspection');
    if (!(assessment.damageLevel in severity)) throw new ApiError(400, 'Invalid damage level');
    if (!Number.isSafeInteger(assessment.damageCharge) || assessment.damageCharge < 0) {
      throw new ApiError(400, 'Damage charge must be a non-negative whole number of paise');
    }

    const extraDayPrice = product.pricing?.extraDayPrice;
    if (!Number.isSafeInteger(extraDayPrice) || extraDayPrice < 0) {
      throw new ApiError(409, 'Product extra-day price is invalid');
    }
    const lateDays = Math.max(0, differenceInDays(item.endDate, receivedAt));
    const lateFee = multiplyPaiseByRate(
      multiplyPaiseByRate(extraDayPrice, lateDays),
      lateFeeMultiplier
    );
    totalLateFee = sumPaise([totalLateFee, lateFee], 'Late fee total');
    totalDamageCharge = sumPaise([totalDamageCharge, assessment.damageCharge], 'Damage charge total');
    maxLateDays = Math.max(maxLateDays, lateDays);
    if (severity[assessment.damageLevel] > severity[damageLevel]) {
      damageLevel = assessment.damageLevel;
    }
    if (assessment.notes) notes.push(assessment.notes);
    photos.push(...(assessment.photos ?? []));
  }

  const deductions = sumPaise([totalLateFee, totalDamageCharge], 'Return deductions');
  const depositDeducted = Math.min(deductions, depositTotal);
  return {
    assessments: assessmentById,
    maxLateDays,
    totalLateFee,
    totalDamageCharge,
    damageLevel,
    damageNotes: notes.join('\n'),
    damagePhotos: photos,
    depositRefunded: depositTotal - depositDeducted,
    depositDeducted,
    outstandingAmount: Math.max(0, deductions - depositTotal),
  };
}
