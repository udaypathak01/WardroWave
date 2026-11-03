import { Booking } from '../models/Booking.js';
import { Review } from '../models/Review.js';
import { notifyBooking } from '../services/fulfillment.helpers.js';
import { addIstDays, istDayRange } from './jobDates.js';
import { env } from '../config/env.js';

/**
 * Requests reviews three days after completion when a booking has unreviewed items.
 */
export async function sendReviewRequests(now = new Date()) {
  const completedDay = istDayRange(now, -3);
  const bookings = await Booking.find({
    status: 'completed',
    timeline: {
      $elemMatch: {
        status: 'completed',
        at: { $gte: completedDay.start, $lt: completedDay.end },
      },
    },
  }).exec();
  let notified = 0;

  for (const booking of bookings) {
    const reviews = await Review.find({ booking: booking._id, user: booking.user })
      .select('product')
      .lean()
      .exec();
    const reviewedProducts = new Set(reviews.map((review) => String(review.product)));
    if (booking.items.every((item) => reviewedProducts.has(String(item.product)))) continue;

    await notifyBooking(booking, {
      type: 'review_request',
      title: 'How was your WardroWave rental?',
      body: `Share your feedback about booking ${booking.bookingNumber}.`,
      event: 'review-request',
      emailTemplate: 'review-request',
      emailContext: {
        bookingNumber: booking.bookingNumber,
        reviewUrl: `${env.FRONTEND_URL}/account/bookings/${booking._id}`,
        completedAt: addIstDays(completedDay.start, 3).toISOString(),
      },
    });
    notified += 1;
  }
  return { notified };
}
