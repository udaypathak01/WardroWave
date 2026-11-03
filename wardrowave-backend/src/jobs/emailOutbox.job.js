import { deliverQueuedEmails } from '../services/email.service.js';

/**
 * Delivers queued email notifications and schedules retries for transient errors.
 */
export async function deliverEmailOutbox() {
  return deliverQueuedEmails();
}
