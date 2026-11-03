import { Booking } from '../models/Booking.js';
import { Product } from '../models/Product.js';
import { notifyAdmins, recordUserNotification } from '../services/notification.service.js';
import { formatINR, multiplyPaiseByRate, sumPaise } from '../utils/money.js';
import { differenceInDays, formatRentalDate } from '../utils/dates.js';
import { env } from '../config/env.js';
import { formatIstDate, istDayStart } from './jobDates.js';

/**
 * Marks overdue rental items and sends daily late-fee notices to customers and admins.
 */
export async function sendOverdueNotices(now = new Date()) {
  const today = istDayStart(now);
  const bookings = await Booking.find({
    status: { $in: ['delivered', 'return_requested'] },
    items: { $elemMatch: { endDate: { $lt: today }, status: { $in: ['delivered', 'return_requested', 'overdue'] } } },
  }).exec();
  let notified = 0;
  let overdueItems = 0;

  for (const booking of bookings) {
    const overdue = booking.items.filter(
      (item) => item.endDate < today && ['delivered', 'return_requested', 'overdue'].includes(item.status)
    );
    if (overdue.length === 0) continue;

    for (const item of overdue) item.status = 'overdue';
    await booking.save();
    overdueItems += overdue.length;

    const products = await Product.find({ _id: { $in: overdue.map((item) => item.product) } })
      .select('pricing.extraDayPrice')
      .lean()
      .exec();
    const productById = new Map(products.map((product) => [String(product._id), product]));
    let runningLateFee = 0;
    let dailyLateFee = 0;
    for (const item of overdue) {
      const product = productById.get(String(item.product));
      if (!product || !Number.isSafeInteger(product.pricing?.extraDayPrice)) {
        throw new Error(`Missing extra-day pricing for overdue booking item ${item._id}`);
      }
      const extraDayPrice = product.pricing.extraDayPrice;
      const dailyFee = multiplyPaiseByRate(extraDayPrice, env.LATE_FEE_MULTIPLIER);
      const daysLate = Math.max(1, differenceInDays(item.endDate, now));
      runningLateFee = sumPaise([
        runningLateFee,
        multiplyPaiseByRate(multiplyPaiseByRate(extraDayPrice, daysLate), env.LATE_FEE_MULTIPLIER),
      ], 'Running late fee');
      dailyLateFee = sumPaise([dailyLateFee, dailyFee], 'Daily late fee');
    }
    const dateKey = formatIstDate(today);
    const emailContext = {
      bookingNumber: booking.bookingNumber,
      endDate: formatRentalDate(overdue.map((item) => item.endDate).sort((a, b) => a - b)[0]),
      dailyLateFee: formatINR(dailyLateFee),
      runningLateFee: formatINR(runningLateFee),
    };
    await recordUserNotification({
      userId: booking.user,
      type: 'overdue_return',
      title: 'Your rental return is overdue',
      body: `Booking ${booking.bookingNumber} is overdue. Late fees may apply each day until the items are returned.`,
      data: { bookingId: booking._id, bookingNumber: booking.bookingNumber, dailyLateFee, runningLateFee },
      eventKey: `booking:${booking._id}:overdue:${dateKey}`,
      emailTemplate: 'overdue-notice',
      emailContext,
    });
    await notifyAdmins({
      eventKey: `booking:${booking._id}:overdue-admin:${dateKey}`,
      type: 'admin_overdue_return',
      title: `Overdue return: ${booking.bookingNumber}`,
      body: `${overdue.length} item(s) on booking ${booking.bookingNumber} are overdue. Running late fee: ${formatINR(runningLateFee)}.`,
      data: { bookingId: booking._id, bookingNumber: booking.bookingNumber, overdueItems: overdue.length, runningLateFee },
    });
    notified += 1;
  }
  return { bookingsNotified: notified, overdueItems };
}
