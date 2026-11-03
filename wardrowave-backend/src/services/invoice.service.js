import PDFDocument from 'pdfkit';
import { Booking } from '../models/Booking.js';
import { ApiError } from '../utils/ApiError.js';
import { formatRentalDate } from '../utils/dates.js';

function formatPaiseForInvoice(amount) {
  const value = BigInt(amount);
  const rupees = value / 100n;
  const paise = String(value % 100n).padStart(2, '0');
  return `INR ${rupees.toLocaleString('en-IN')}.${paise}`;
}

/**
 * Builds a PDF invoice for a confirmed booking owned by the requesting customer.
 */
export async function buildBookingInvoice(bookingId, userId) {
  const booking = await Booking.findOne({ _id: bookingId, user: userId }).lean().exec();
  if (!booking) throw new ApiError(404, 'Booking not found');
  if (!booking.invoiceNumber || !booking.pricing) {
    throw new ApiError(409, 'Invoice is not available until payment is confirmed');
  }

  return new Promise((resolve, reject) => {
    const document = new PDFDocument({ size: 'A4', margin: 48 });
    const chunks = [];
    document.on('data', (chunk) => chunks.push(chunk));
    document.on('end', () => resolve(Buffer.concat(chunks)));
    document.on('error', reject);

    document.fontSize(22).text('WardroWave', { continued: true });
    document.fontSize(18).text('  INVOICE', { align: 'right' });
    document.moveDown();
    document.fontSize(10);
    document.text(`Invoice: ${booking.invoiceNumber}`);
    document.text(`Booking: ${booking.bookingNumber}`);
    document.text(`Issued: ${new Date(booking.createdAt).toISOString().slice(0, 10)}`);
    document.moveDown();
    document.fontSize(12).text('Bill to', { underline: true });
    document.fontSize(10);
    const address = booking.shippingAddress;
    document.text(address.fullName ?? address.name ?? 'Customer');
    document.text(address.line1 ?? address.addressLine1 ?? '');
    if (address.line2 ?? address.addressLine2) {
      document.text(address.line2 ?? address.addressLine2);
    }
    document.text([address.city, address.state, address.pincode].filter(Boolean).join(', '));
    document.moveDown();
    document.fontSize(12).text('Rental items', { underline: true });
    document.fontSize(10);
    for (const item of booking.items) {
      const size = item.sizeSnapshot ? ` (${item.sizeSnapshot})` : '';
      document.text(`${item.titleSnapshot}${size}`);
      document.text(
        `${formatRentalDate(item.startDate)} to ${formatRentalDate(item.endDate)} - ${item.rentalDays} days`,
        { indent: 12 }
      );
      document.text(`Rental charge: ${formatPaiseForInvoice(item.rentalCharge)}`, { indent: 12 });
      document.moveDown(0.5);
    }
    document.moveDown();
    const totals = [
      ['Rental subtotal', booking.pricing.rentalSubtotal],
      ['Discount', -booking.pricing.discount],
      ['Delivery', booking.pricing.deliveryFee],
      [`GST (${booking.pricing.gstPercent}%)`, booking.pricing.gstAmount],
      ['Refundable security deposit', booking.pricing.depositTotal],
      ['Total paid', booking.pricing.grandTotal],
    ];
    for (const [label, amount] of totals) {
      const formatted = amount < 0
        ? `- ${formatPaiseForInvoice(-amount)}`
        : formatPaiseForInvoice(amount);
      document.text(label, 48, document.y, { continued: true });
      document.text(formatted, { align: 'right' });
    }
    document.moveDown();
    document.fontSize(9).text(
      'Security deposit is refundable after return inspection, subject to late fees or damage deductions.'
    );
    document.end();
  });
}
