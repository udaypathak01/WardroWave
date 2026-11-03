import Handlebars from 'handlebars';
import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { EmailOutbox } from '../models/EmailOutbox.js';
import { logger } from '../utils/logger.js';

const MAX_ATTEMPTS = 4;
const STALE_SEND_MS = 15 * 60_000;

const templates = {
  generic: {
    html: '<p>{{message}}</p>',
    text: '{{message}}',
  },
  'support-contact': {
    html: '<p><strong>From:</strong> {{name}} ({{email}})</p><p><strong>Phone:</strong> {{phone}}</p><p><strong>Subject:</strong> {{subject}}</p><p>{{message}}</p>',
    text: 'From: {{name}} ({{email}})\nPhone: {{phone}}\nSubject: {{subject}}\n\n{{message}}',
  },
  welcome: {
    html: '<p>Hi {{name}},</p><p>Welcome to WardroWave. Your account is ready for your next rental.</p>',
    text: 'Hi {{name}}, welcome to WardroWave. Your account is ready for your next rental.',
  },
  'booking-confirmed': {
    html: '<p>Hi {{name}},</p><p>Booking <strong>{{bookingNumber}}</strong> is confirmed.</p><p>{{itemsSummary}}</p><p>Rental dates: {{startDate}} to {{endDate}}.<br>Delivery address: {{address}}.</p><p>Total paid: {{grandTotal}}. This includes a refundable security deposit of {{depositTotal}}, subject to return inspection.</p><p><a href="{{invoiceUrl}}">View your booking and invoice</a></p>',
    text: 'Hi {{name}}, booking {{bookingNumber}} is confirmed. {{itemsSummary}} Rental dates: {{startDate}} to {{endDate}}. Address: {{address}}. Total paid: {{grandTotal}}, including a refundable security deposit of {{depositTotal}} subject to return inspection. Booking and invoice: {{invoiceUrl}}',
  },
  'payment-failed': {
    html: '<p>Hi {{name}},</p><p>Payment for booking {{bookingNumber}} did not complete. {{failureReason}}</p><p>Your reservation is held until {{holdExpiresAt}}. <a href="{{retryUrl}}">Retry payment</a> before then.</p>',
    text: 'Hi {{name}}, payment for booking {{bookingNumber}} did not complete. {{failureReason}} Your reservation is held until {{holdExpiresAt}}. Retry payment: {{retryUrl}}',
  },
  'booking-expired': {
    html: '<p>Hi {{name}},</p><p>The payment hold for booking {{bookingNumber}} expired before payment was completed. The reserved items have been released. Start a new checkout to book them.</p>',
    text: 'Hi {{name}}, the payment hold for booking {{bookingNumber}} expired before payment was completed. The items were released; start a new checkout to book them.',
  },
  'booking-cancelled': {
    html: '<p>Hi {{name}},</p><p>Booking {{bookingNumber}} has been cancelled.</p><p>Refund: {{refundAmount}}.<br>Amount retained under the cancellation policy: {{retainedAmount}}. Refunds generally take 5–7 working days to appear after processing.</p>',
    text: 'Hi {{name}}, booking {{bookingNumber}} has been cancelled. Refund: {{refundAmount}}. Amount retained under the cancellation policy: {{retainedAmount}}. Refunds generally take 5–7 working days to appear after processing.',
  },
  'order-dispatched': {
    html: '<p>Hi {{name}},</p><p>Booking {{bookingNumber}} is on its way via {{carrier}}. Tracking number: {{trackingNumber}}.</p>',
    text: 'Hi {{name}}, booking {{bookingNumber}} is on its way via {{carrier}}. Tracking number: {{trackingNumber}}.',
  },
  'order-delivered': {
    html: '<p>Hi {{name}},</p><p>Booking {{bookingNumber}} has been delivered. Your rental return date is {{returnDate}}.</p>',
    text: 'Hi {{name}}, booking {{bookingNumber}} has been delivered. Your rental return date is {{returnDate}}.',
  },
  'start-reminder': {
    html: '<p>Hi {{name}},</p><p>Your WardroWave rental for booking {{bookingNumber}} starts tomorrow, {{startDate}}. We hope you love it.</p>',
    text: 'Hi {{name}}, your WardroWave rental for booking {{bookingNumber}} starts tomorrow, {{startDate}}. We hope you love it.',
  },
  'return-reminder': {
    html: '<p>Hi {{name}},</p><p>Your rental for booking {{bookingNumber}} is due back on {{endDate}}. {{pickupInstructions}}</p>',
    text: 'Hi {{name}}, your rental for booking {{bookingNumber}} is due back on {{endDate}}. {{pickupInstructions}}',
  },
  'overdue-notice': {
    html: '<p>Hi {{name}},</p><p>The rental for booking {{bookingNumber}} was due on {{endDate}}. A late fee of {{dailyLateFee}} per day may apply until the items are received. Please arrange the return as soon as possible.</p>',
    text: 'Hi {{name}}, the rental for booking {{bookingNumber}} was due on {{endDate}}. A late fee of {{dailyLateFee}} per day may apply until the items are received. Please arrange the return as soon as possible.',
  },
  'return-received': {
    html: '<p>Hi {{name}},</p><p>We received the return for booking {{bookingNumber}}. Our team will inspect the items and update you about your deposit settlement.</p>',
    text: 'Hi {{name}}, we received the return for booking {{bookingNumber}}. Our team will inspect the items and update you about your deposit settlement.',
  },
  settlement: {
    html: '<p>Hi {{name}},</p><p>Return inspection for booking {{bookingNumber}} is complete.</p><p>Late fee: {{lateFee}}.<br>Damage charge: {{damageCharge}}.<br>Deposit refunded: {{depositRefunded}}.<br>Deposit deducted: {{depositDeducted}}.<br>Outstanding amount: {{outstandingAmount}}.</p>',
    text: 'Hi {{name}}, return inspection for booking {{bookingNumber}} is complete. Late fee: {{lateFee}}. Damage charge: {{damageCharge}}. Deposit refunded: {{depositRefunded}}. Deposit deducted: {{depositDeducted}}. Outstanding amount: {{outstandingAmount}}.',
  },
  'refund-processed': {
    html: '<p>Hi {{name}},</p><p>Your refund of {{refundAmount}} for booking {{bookingNumber}} has been processed. Your bank may take 5–7 working days to reflect it.</p>',
    text: 'Hi {{name}}, your refund of {{refundAmount}} for booking {{bookingNumber}} has been processed. Your bank may take 5–7 working days to reflect it.',
  },
  'review-request': {
    html: '<p>Hi {{name}},</p><p>We hope you enjoyed your WardroWave rental for booking {{bookingNumber}}. <a href="{{reviewUrl}}">Share your review</a> and help other renters.</p>',
    text: 'Hi {{name}}, we hope you enjoyed your WardroWave rental for booking {{bookingNumber}}. Share your review: {{reviewUrl}}',
  },
  'admin-new-order': {
    html: '<p>A new booking has been paid.</p><p>Booking: {{bookingNumber}}.<br>Customer: {{customerEmail}}.<br>Total: {{grandTotal}}.<br>Rental dates: {{startDate}} to {{endDate}}.</p>',
    text: 'A new booking has been paid. Booking: {{bookingNumber}}. Customer: {{customerEmail}}. Total: {{grandTotal}}. Rental dates: {{startDate}} to {{endDate}}.',
  },
  'admin-low-stock': {
    html: '<p>Low inventory alert for <strong>{{productTitle}}</strong>, variant {{variantLabel}}. Available units: {{availableCount}}.</p>',
    text: 'Low inventory alert for {{productTitle}}, variant {{variantLabel}}. Available units: {{availableCount}}.',
  },
};

const layout = Handlebars.compile(
  '<!doctype html><html><body style="margin:0;background:#f7f5fb;font-family:Arial,sans-serif;color:#211a2d"><div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden"><header style="padding:24px;background:#6c3db5;color:#fff;font-size:22px;font-weight:bold">WardroWave</header><main style="padding:28px;line-height:1.6">{{{body}}}</main><footer style="padding:20px 28px;background:#f1edf7;color:#625b6b;font-size:13px">Need help? Contact <a href="mailto:{{supportEmail}}">{{supportEmail}}</a>.</footer></div></body></html>'
);

let transport;

function getTransport() {
  if (!env.SMTP_HOST || !env.MAIL_FROM) {
    throw new Error('SMTP_HOST and MAIL_FROM must be configured to send email');
  }
  transport ??= nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    ...(env.SMTP_USER ? { auth: { user: env.SMTP_USER, pass: env.SMTP_PASS } } : {}),
  });
  return transport;
}

/**
 * Renders an email's HTML and plain-text alternatives using the shared brand layout.
 */
export function renderEmail({ template = 'generic', context = {}, text = '' }) {
  const definition = templates[template];
  if (!definition) throw new Error(`Unknown email template: ${template}`);
  const values = { message: text, ...context };
  const htmlBody = Handlebars.compile(definition.html)(values);
  return {
    html: layout({ body: new Handlebars.SafeString(htmlBody), supportEmail: env.SUPPORT_EMAIL }),
    text: Handlebars.compile(definition.text, { noEscape: true })(values),
  };
}

/**
 * Adds a deduplicated email message to the durable outbox.
 */
export async function queueEmail({
  eventKey,
  to,
  subject,
  text,
  template = 'generic',
  context = {},
  session,
}) {
  if (!templates[template]) throw new Error(`Unknown email template: ${template}`);
  await EmailOutbox.updateOne(
    { eventKey },
    {
      $setOnInsert: {
        eventKey,
        to,
        subject,
        text,
        template,
        context,
        status: 'queued',
        nextAttemptAt: new Date(),
      },
    },
    { upsert: true, ...(session ? { session } : {}) }
  ).exec();
}

/**
 * Sends one email message using the configured SMTP relay.
 */
export async function sendEmail({ to, subject, text, template = 'generic', context = {} }) {
  const rendered = renderEmail({ template, context, text });
  return getTransport().sendMail({
    from: env.MAIL_FROM,
    to,
    subject,
    text: rendered.text,
    html: rendered.html,
  });
}

/**
 * Delivers a bounded batch of queued email messages with retry and stale-claim recovery.
 */
export async function deliverQueuedEmails(now = new Date(), batchSize = 20) {
  let delivered = 0;
  for (let index = 0; index < batchSize; index += 1) {
    const staleBefore = new Date(now.getTime() - STALE_SEND_MS);
    const message = await EmailOutbox.findOneAndUpdate(
      {
        attempts: { $lt: MAX_ATTEMPTS },
        $or: [
          { status: 'queued', nextAttemptAt: { $lte: now } },
          { status: 'failed', nextAttemptAt: { $lte: now } },
          { status: 'sending', updatedAt: { $lte: staleBefore } },
        ],
      },
      { $set: { status: 'sending' }, $inc: { attempts: 1 } },
      { new: true, sort: { createdAt: 1 } }
    ).exec();
    if (!message) break;

    try {
      await sendEmail(message);
      message.status = 'sent';
      message.sentAt = new Date();
      message.lastError = undefined;
      await message.save();
      delivered += 1;
    } catch (error) {
      const exhausted = message.attempts >= MAX_ATTEMPTS;
      message.status = exhausted ? 'dead' : 'failed';
      message.lastError = error.message.slice(0, 1000);
      message.nextAttemptAt = new Date(now.getTime() + Math.min(60, 2 ** (message.attempts - 1)) * 60_000);
      await message.save();
      logger.error(
        { err: error, emailOutboxId: message._id, attempts: message.attempts, exhausted },
        'Queued email delivery failed'
      );
    }
  }
  return delivered;
}
