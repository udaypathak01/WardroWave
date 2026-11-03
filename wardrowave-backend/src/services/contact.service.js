import { randomUUID } from 'node:crypto';
import { env } from '../config/env.js';
import { queueEmail } from './email.service.js';

export async function submitContactMessage(message) {
  await queueEmail({
    eventKey: `contact:${randomUUID()}`,
    to: env.SUPPORT_EMAIL,
    subject: `Contact inquiry: ${message.subject}`,
    template: 'support-contact',
    text: [
      `Name: ${message.name}`,
      `Email: ${message.email}`,
      `Phone: ${message.phone || 'Not provided'}`,
      '',
      message.message,
    ].join('\n'),
    context: message,
  });
  return { accepted: true };
}
