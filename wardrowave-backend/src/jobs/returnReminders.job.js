import { Booking } from '../models/Booking.js';
import { formatIstDate, istDayRange } from './jobDates.js';
import { notifyBooking } from '../services/fulfillment.helpers.js';

/**
 * Sends return reminders two days and one day before each rental end date.
 */
export async function sendReturnReminders(now = new Date()) {
  let notified = 0;
  for (const daysAhead of [2, 1]) {
    const { start, end } = istDayRange(now, daysAhead);
    const bookings = await Booking.find({
      status: { $in: ['delivered', 'return_requested'] },
      items: {
        $elemMatch: {
          endDate: { $gte: start, $lt: end },
          status: { $in: ['delivered', 'return_requested'] },
        },
      },
    }).exec();

    for (const booking of bookings) {
      await notifyBooking(booking, {
        type: 'rental_return_reminder',
        title: daysAhead === 2 ? 'Your rental is due back in two days' : 'Your rental is due back tomorrow',
        body: `Your rental for booking ${booking.bookingNumber} is due back on ${formatIstDate(start)}.`,
        event: `return-reminder:${daysAhead}:${formatIstDate(start)}`,
        emailTemplate: 'return-reminder',
        emailContext: {
          bookingNumber: booking.bookingNumber,
          endDate: formatIstDate(start),
          pickupInstructions: 'Please follow the return instructions in your account to schedule pickup.',
        },
      });
      notified += 1;
    }
  }
  return { notified };
}
