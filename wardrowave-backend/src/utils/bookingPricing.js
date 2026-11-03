import { sumPaise } from './money.js';

export function calculateCancellationRefund(booking, now) {
  if (!booking || !Array.isArray(booking.items) || booking.items.length === 0) {
    throw new TypeError('Booking items are required');
  }

  const startDate = new Date(
    booking.items.reduce((earliest, item) => {
      const itemStart = new Date(item.startDate).getTime();
      return itemStart < earliest ? itemStart : earliest;
    }, Number.POSITIVE_INFINITY)
  );
  const rentalSubtotal = booking.pricing?.rentalSubtotal ?? 0;
  if (!Number.isSafeInteger(rentalSubtotal) || rentalSubtotal < 0) {
    throw new TypeError('Booking rental subtotal is invalid');
  }
  const discount = booking.pricing?.discount ?? 0;
  const rentalCharge = rentalSubtotal - discount;
  const deposit = booking.pricing?.depositTotal ?? 0;
  const freeCancelHours = Number(booking.freeCancelHours ?? 48);
  const nowDate = new Date(now);
  if (
    Number.isNaN(startDate.getTime()) ||
    Number.isNaN(nowDate.getTime()) ||
    !Number.isSafeInteger(rentalCharge) ||
    !Number.isSafeInteger(discount) ||
    rentalCharge < 0 ||
    discount < 0 ||
    discount > rentalSubtotal ||
    deposit < 0 ||
    !Number.isSafeInteger(deposit) ||
    !Number.isFinite(freeCancelHours) ||
    freeCancelHours < 0
  ) {
    throw new TypeError('Booking cancellation inputs are invalid');
  }

  if (booking.status === 'cancelled') {
    const refundAmount = booking.cancellation?.refundAmount ?? 0;
    const retainedAmount = booking.cancellation?.retainedAmount ?? 0;
    return {
      refundable: refundAmount,
      retained: retainedAmount,
      deposit,
      refundAmount,
      retainedAmount,
      depositRefund: 0,
      totalRefund: refundAmount,
      isFreeCancellation: false,
      canCancel: false,
      reason: 'already_cancelled',
    };
  }

  if (['dispatched', 'partially_dispatched', 'delivered'].includes(booking.status)) {
    return {
      refundable: 0,
      retained: rentalCharge,
      deposit,
      refundAmount: 0,
      retainedAmount: rentalCharge,
      depositRefund: 0,
      totalRefund: 0,
      isFreeCancellation: false,
      canCancel: false,
      reason: 'already_dispatched',
    };
  }

  const msUntilStart = startDate.getTime() - nowDate.getTime();
  if (msUntilStart >= freeCancelHours * 60 * 60 * 1000) {
    return {
      refundable: rentalCharge,
      retained: 0,
      deposit,
      refundAmount: rentalCharge,
      retainedAmount: 0,
      depositRefund: deposit,
      totalRefund: sumPaise([rentalCharge, deposit], 'Cancellation refund'),
      isFreeCancellation: true,
      canCancel: true,
      reason: 'free_cancellation',
    };
  }

  const retained = Number((BigInt(rentalCharge) + 1n) / 2n);
  return {
    refundable: rentalCharge - retained,
    retained,
    deposit,
    refundAmount: rentalCharge - retained,
    retainedAmount: retained,
    depositRefund: deposit,
    totalRefund: sumPaise([rentalCharge - retained, deposit], 'Cancellation refund'),
    isFreeCancellation: false,
    canCancel: true,
    reason: 'late_cancellation',
  };
}
