import { Booking } from '../models/Booking.js';
import { InventoryUnit } from '../models/InventoryUnit.js';
import { Payment } from '../models/Payment.js';
import { ApiError } from '../utils/ApiError.js';
import {
  addCalendarDays,
  countRentalDays,
  normalizeCalendarDate,
  parseRentalDate,
} from '../utils/dates.js';

/**
 * Produces date-bounded booking, captured-payment, refund, and inventory summaries.
 */
export async function getOperationsReport({ from, to }) {
  const start = parseRentalDate(from);
  const end = parseRentalDate(to);
  if (end < start) throw new ApiError(400, 'Report end date must not precede its start date');
  const today = normalizeCalendarDate(new Date());
  if (start > today || end > today) {
    throw new ApiError(400, 'Report dates cannot be in the future');
  }
  if (countRentalDays(start, end) > 366) {
    throw new ApiError(400, 'Report range cannot exceed 366 days');
  }
  const exclusiveEnd = addCalendarDays(end, 1);
  const [bookings, payments, inventory] = await Promise.all([
    Booking.aggregate([
      { $match: { createdAt: { $gte: start, $lt: exclusiveEnd } } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          bookingValue: { $sum: '$pricing.grandTotal' },
        },
      },
    ]).exec(),
    Payment.aggregate([
      {
        $match: {
          status: { $in: ['captured', 'partially_refunded', 'refunded'] },
          paidAt: { $gte: start, $lt: exclusiveEnd },
        },
      },
      {
        $group: {
          _id: null,
          capturedAmount: { $sum: '$amount' },
          refundedAmount: { $sum: '$refundedAmount' },
          count: { $sum: 1 },
        },
      },
    ]).exec(),
    InventoryUnit.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]).exec(),
  ]);
  const paymentSummary = payments[0] ?? { capturedAmount: 0, refundedAmount: 0, count: 0 };
  for (const amount of [
    paymentSummary.capturedAmount,
    paymentSummary.refundedAmount,
    ...bookings.map((row) => row.bookingValue),
  ]) {
    if (!Number.isSafeInteger(amount)) {
      throw new ApiError(500, 'Report totals exceed the safe paise range');
    }
  }
  return {
    period: { from, to },
    bookings: bookings.map((row) => ({
      status: row._id,
      count: row.count,
      bookingValue: row.bookingValue,
    })),
    payments: {
      capturedCount: paymentSummary.count,
      capturedAmount: paymentSummary.capturedAmount,
      refundedAmount: paymentSummary.refundedAmount,
      netAmount: paymentSummary.capturedAmount - paymentSummary.refundedAmount,
    },
    inventory: inventory.map(({ _id, count }) => ({ status: _id, count })),
  };
}
