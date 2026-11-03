import { Booking } from '../models/Booking.js';
import { Reservation } from '../models/Reservation.js';
import { ApiError } from '../utils/ApiError.js';
import { withTransaction } from '../utils/withTransaction.js';
import { auditMutation, loadBooking, notifyBooking } from './fulfillment.helpers.js';

/**
 * Marks a confirmed booking dispatched and records outbound tracking details.
 */
export async function dispatchBooking({ bookingId, actor, carrier, trackingNumber, request }) {
  return withTransaction(async (session) => {
    const booking = await loadBooking(bookingId, session);
    if (booking.status !== 'confirmed') {
      throw new ApiError(409, 'Only confirmed bookings can be dispatched');
    }
    const now = new Date();
    booking.status = 'dispatched';
    booking.items.forEach((item) => { item.status = 'dispatched'; });
    booking.logistics.outboundCarrier = carrier;
    booking.logistics.outboundTracking = trackingNumber;
    booking.logistics.dispatchedAt = now;
    booking.timeline.push({ status: 'dispatched', note: `Dispatched by ${carrier}`, actor: actor._id, at: now });
    await booking.save({ session });
    await Reservation.updateMany(
      { booking: booking._id, status: 'confirmed' },
      { $set: { status: 'active' } },
      { session }
    ).exec();
    await auditMutation({
      actor,
      booking,
      action: 'booking.dispatched',
      summary: { carrier, trackingNumber },
      request,
      session,
    });
    await notifyBooking(booking, {
      type: 'booking_dispatched',
      title: 'Your order has been dispatched',
      body: `Booking ${booking.bookingNumber} is on its way. Tracking: ${trackingNumber}.`,
      event: 'dispatched',
      session,
    });
    return booking.toJSON();
  });
}

/**
 * Marks a dispatched booking delivered and records the delivery timestamp.
 */
export async function deliverBooking({ bookingId, actor, request }) {
  return withTransaction(async (session) => {
    const booking = await loadBooking(bookingId, session);
    if (booking.status !== 'dispatched') {
      throw new ApiError(409, 'Only dispatched bookings can be marked delivered');
    }
    const now = new Date();
    booking.status = 'delivered';
    booking.items.forEach((item) => { item.status = 'delivered'; });
    booking.logistics.deliveredAt = now;
    booking.timeline.push({ status: 'delivered', note: 'Delivery confirmed', actor: actor._id, at: now });
    await booking.save({ session });
    await auditMutation({ actor, booking, action: 'booking.delivered', summary: {}, request, session });
    await notifyBooking(booking, {
      type: 'booking_delivered',
      title: 'Your order was delivered',
      body: `Booking ${booking.bookingNumber} has been delivered.`,
      event: 'delivered',
      session,
    });
    return booking.toJSON();
  });
}

/**
 * Records a customer's return request and preferred pickup date.
 */
export async function requestReturn({ bookingId, userId, pickupAt }) {
  return withTransaction(async (session) => {
    const booking = await Booking.findOne({ _id: bookingId, user: userId }).session(session).exec();
    if (!booking) throw new ApiError(404, 'Booking not found');
    if (booking.status !== 'delivered') {
      throw new ApiError(409, 'Only delivered bookings can be returned');
    }
    const pickupDate = new Date(pickupAt);
    if (Number.isNaN(pickupDate.getTime()) || pickupDate < new Date()) {
      throw new ApiError(400, 'Pickup date must be in the future');
    }
    booking.status = 'return_requested';
    booking.items.forEach((item) => { item.status = 'return_requested'; });
    booking.logistics.pickupScheduledAt = pickupDate;
    booking.timeline.push({
      status: 'return_requested',
      note: 'Customer requested a return pickup',
      actor: userId,
    });
    await booking.save({ session });
    await notifyBooking(booking, {
      type: 'return_requested',
      title: 'Return pickup requested',
      body: `Your return pickup for booking ${booking.bookingNumber} is scheduled.`,
      event: 'return_requested',
      session,
    });
    return booking.toJSON();
  });
}

/**
 * Marks a requested return received at the warehouse with its tracking data.
 */
export async function receiveReturn({ bookingId, actor, carrier, trackingNumber, request }) {
  return withTransaction(async (session) => {
    const booking = await loadBooking(bookingId, session);
    if (booking.status !== 'return_requested') {
      throw new ApiError(409, 'Only requested returns can be received');
    }
    const now = new Date();
    booking.status = 'returned';
    booking.items.forEach((item) => { item.status = 'returned'; });
    booking.logistics.returnCarrier = carrier;
    booking.logistics.returnTracking = trackingNumber;
    booking.logistics.receivedAt = now;
    booking.timeline.push({ status: 'returned', note: 'Return received at warehouse', actor: actor._id, at: now });
    await booking.save({ session });
    await auditMutation({
      actor,
      booking,
      action: 'booking.return_received',
      summary: { carrier, trackingNumber },
      request,
      session,
    });
    await notifyBooking(booking, {
      type: 'return_received',
      title: 'Return received',
      body: `The returned items for booking ${booking.bookingNumber} have reached our warehouse.`,
      event: 'returned',
      session,
    });
    return booking.toJSON();
  });
}
