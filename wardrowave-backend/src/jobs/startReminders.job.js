import { Booking } from '../models/Booking.js';
import { formatIstDate, istDayRange } from './jobDates.js';
import { notifyBooking } from '../services/fulfillment.helpers.js';

/**
 * Sends one in-app and email reminder for bookings starting tomorrow.
 */
export async function sendStartReminders(now = new Date()) {
  const { start, end } = istDayRange(now, 1);
  const bookings = await Booking.find({
    status: { $in: ['confirmed', 'dispatched'] },
    items: { $elemMatch: { startDate: { $gte: start, $lt: end }, status: { $in: ['confirmed', 'dispatched'] } } },
  }).exec();

  let notified = 0;
  for (const booking of bookings) {
    await notifyBooking(booking, {
      type: 'rental_start_reminder',
      title: 'Your rental starts tomorrow',
      body: `Your WardroWave rental for booking ${booking.bookingNumber} starts tomorrow.`,
      event: `start-reminder:${formatIstDate(start)}`,
      emailTemplate: 'start-reminder',
      emailContext: {
        bookingNumber: booking.bookingNumber,
        startDate: formatIstDate(start),
      },
    });
    notified += 1;
  }
  return { notified };
}
