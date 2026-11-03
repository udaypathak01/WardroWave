import { InventoryUnit } from '../models/InventoryUnit.js';
import { Payment } from '../models/Payment.js';
import { Product } from '../models/Product.js';
import { Reservation } from '../models/Reservation.js';
import { ApiError } from '../utils/ApiError.js';
import { formatINR } from '../utils/money.js';
import { calculateReturnSettlement } from '../utils/returnSettlement.js';
import { withTransaction } from '../utils/withTransaction.js';
import { writeAuditLog } from './audit.service.js';
import { createRefundRecord, submitRefund } from './payment.service.js';
import { getRentalSettings } from './settings.service.js';
import { auditMutation, loadBooking, notifyBooking } from './fulfillment.helpers.js';

/**
 * Inspects returned garments, computes late and damage deductions, and refunds the deposit remainder.
 */
export async function inspectReturn({ bookingId, actor, items: assessments, request }) {
  const result = await withTransaction(async (session) => {
    const booking = await loadBooking(bookingId, session);
    if (booking.status !== 'returned') {
      throw new ApiError(409, 'Only received returns can be inspected');
    }
    if (assessments.length !== booking.items.length) {
      throw new ApiError(400, 'An assessment is required for every booking item');
    }
    const settings = await getRentalSettings({ session });
    const receivedAt = booking.logistics.receivedAt ?? new Date();
    const productIds = booking.items.map((item) => item.product);
    const products = await Product.find({ _id: { $in: productIds } })
      .session(session)
      .lean()
      .exec();
    const settlement = calculateReturnSettlement({
      bookingItems: booking.items,
      assessments,
      products,
      receivedAt,
      lateFeeMultiplier: settings.lateFeeMultiplier,
      depositTotal: booking.pricing.depositTotal,
    });

    for (const item of booking.items) {
      const assessment = settlement.assessments.get(String(item._id));
      const product = products.find((entry) => String(entry._id) === String(item.product));

      item.status = 'inspected';
      const unit = await InventoryUnit.findById(item.unit).session(session).exec();
      if (!unit) throw new ApiError(409, 'An inventory unit could not be loaded for inspection');
      const mustRetire =
        assessment.damageLevel === 'major' ||
        assessment.damageLevel === 'lost' ||
        unit.rentCount >= unit.maxRentCount;
      if (mustRetire) {
        unit.status = 'retired';
        unit.cleaningUntil = undefined;
      } else {
        unit.status = 'cleaning';
        unit.cleaningUntil = new Date(
          receivedAt.getTime() +
          (product.pricing.returnBufferDays ?? settings.returnBufferDays) * 24 * 60 * 60 * 1000
        );
      }
      unit.condition = assessment.damageLevel === 'minor' ? 'fair' : unit.condition;
      unit.conditionNotes = assessment.notes || unit.conditionNotes;
      await unit.save({ session });
    }

    booking.status = 'completed';
    booking.items.forEach((item) => { item.status = 'completed'; });
    booking.settlement = {
      lateDays: settlement.maxLateDays,
      lateFee: settlement.totalLateFee,
      damageLevel: settlement.damageLevel,
      damageCharge: settlement.totalDamageCharge,
      damageNotes: settlement.damageNotes,
      damagePhotos: settlement.damagePhotos,
      depositRefunded: settlement.depositRefunded,
      depositDeducted: settlement.depositDeducted,
      outstandingAmount: settlement.outstandingAmount,
      settledAt: new Date(),
    };
    booking.timeline.push({
      status: 'completed',
      note: 'Return inspection completed and settlement calculated',
      actor: actor._id,
      at: new Date(),
    });
    await booking.save({ session });
    await Reservation.updateMany(
      { booking: booking._id, status: { $in: ['active', 'confirmed'] } },
      { $set: { status: 'completed' } },
      { session }
    ).exec();

    let refundId = null;
    if (settlement.depositRefunded > 0) {
      const payment = await Payment.findOne({ booking: booking._id, status: 'captured' }).session(session).exec();
      if (!payment) throw new ApiError(409, 'Captured payment record was not found');
      const refund = await createRefundRecord({
        booking,
        payment,
        amount: settlement.depositRefunded,
        reason: 'deposit_return',
        initiatedBy: actor._id,
        notes: 'Refund of security deposit after return inspection',
        session,
      });
      refundId = refund._id;
    }
    await auditMutation({
      actor,
      booking,
      action: 'booking.return_inspected',
      summary: {
        maxLateDays: settlement.maxLateDays,
        totalLateFee: settlement.totalLateFee,
        totalDamageCharge: settlement.totalDamageCharge,
        depositRefunded: settlement.depositRefunded,
        depositDeducted: settlement.depositDeducted,
        outstandingAmount: settlement.outstandingAmount,
      },
      request,
      session,
    });
    await notifyBooking(booking, {
      type: 'return_inspected',
      title: 'Return inspection complete',
      body: `Return inspection for booking ${booking.bookingNumber} is complete. Deposit refund: ${formatINR(settlement.depositRefunded)}.`,
      event: 'inspected',
      session,
    });
    return { booking, refundId };
  });

  if (result.refundId) await submitRefund(result.refundId);
  return { booking: result.booking.toJSON(), refundId: result.refundId };
}

/**
 * Marks a cleaning unit available for future date reservations.
 */
export async function markUnitClean({ unitId, actor, request }) {
  return withTransaction(async (session) => {
    const unit = await InventoryUnit.findById(unitId).session(session).exec();
    if (!unit) throw new ApiError(404, 'Inventory unit not found');
    if (unit.status !== 'cleaning') throw new ApiError(409, 'Only cleaning units can be marked clean');
    if (unit.rentCount >= unit.maxRentCount) {
      unit.status = 'retired';
    } else {
      unit.status = 'available';
      unit.lastCleanedAt = new Date();
    }
    unit.cleaningUntil = undefined;
    await unit.save({ session });
    await writeAuditLog({
      actor: actor._id,
      actorRole: actor.role,
      action: 'inventory.unit_cleaned',
      entityType: 'InventoryUnit',
      entityId: unit._id,
      summary: { status: unit.status },
      ip: request.ip,
      userAgent: request.userAgent,
      requestId: request.requestId,
      session,
    });
    return unit.toJSON();
  });
}
