import cron from 'node-cron';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';
import { runWithJobLock } from './jobLock.js';
import { releaseExpiredHolds } from './releaseExpiredHolds.job.js';
import { reconcilePendingPayments } from './paymentReconciliation.job.js';
import { retryPendingRefunds } from './retryPendingRefunds.job.js';
import { completeExpiredCleaning } from './cleaningComplete.job.js';
import { deliverEmailOutbox } from './emailOutbox.job.js';
import { sendStartReminders } from './startReminders.job.js';
import { sendReturnReminders } from './returnReminders.job.js';
import { sendOverdueNotices } from './overdueReturns.job.js';
import { sendReviewRequests } from './reviewRequests.job.js';
import { alertLowStock } from './lowStockAlert.job.js';
import { cleanupOldData } from './cleanupOldData.job.js';
import { retryPendingRazorpayWebhooks } from '../services/payment.service.js';

const taskDefinitions = [
  {
    name: 'release-expired-holds',
    schedule: '* * * * *',
    lockMs: 55_000,
    task: releaseExpiredHolds,
  },
  {
    name: 'reconcile-pending-payments',
    schedule: '*/15 * * * *',
    lockMs: 14 * 60_000,
    task: reconcilePendingPayments,
  },
  {
    name: 'retry-pending-webhooks',
    schedule: '* * * * *',
    lockMs: 55_000,
    task: retryPendingRazorpayWebhooks,
  },
  {
    name: 'retry-pending-refunds',
    schedule: '*/30 * * * *',
    lockMs: 29 * 60_000,
    task: retryPendingRefunds,
  },
  {
    name: 'cleaning-complete',
    schedule: '0 * * * *',
    lockMs: 55 * 60_000,
    task: completeExpiredCleaning,
  },
  {
    name: 'email-outbox',
    schedule: '* * * * *',
    lockMs: 55_000,
    task: deliverEmailOutbox,
  },
  { name: 'start-reminders', schedule: '0 9 * * *', lockMs: 55 * 60_000, task: sendStartReminders },
  { name: 'return-reminders', schedule: '30 9 * * *', lockMs: 55 * 60_000, task: sendReturnReminders },
  { name: 'overdue-returns', schedule: '0 10 * * *', lockMs: 55 * 60_000, task: sendOverdueNotices },
  { name: 'review-requests', schedule: '0 11 * * *', lockMs: 55 * 60_000, task: sendReviewRequests },
  { name: 'low-stock-alert', schedule: '0 8 * * *', lockMs: 55 * 60_000, task: alertLowStock },
  { name: 'cleanup-old-data', schedule: '0 3 * * *', lockMs: 55 * 60_000, task: cleanupOldData },
];

let scheduledTasks = [];

/**
 * Starts scheduled jobs with distributed locks so only one app instance runs each job.
 */
export function startJobs() {
  if (env.NODE_ENV === 'test') {
    logger.info('Scheduled jobs disabled in test environment');
    return;
  }
  if (scheduledTasks.length > 0) return;
  scheduledTasks = taskDefinitions.map(({ name, schedule, lockMs, task }) =>
    cron.schedule(schedule, async () => {
      try {
        await runWithJobLock(name, lockMs, task);
      } catch (error) {
        logger.error({ err: error, job: name }, 'Scheduled job could not acquire or release its lock');
      }
    }, { timezone: 'Asia/Kolkata' })
  );
  logger.info({ count: scheduledTasks.length }, 'Scheduled jobs started');
}

/**
 * Stops all cron tasks before application shutdown.
 */
export function stopJobs() {
  for (const task of scheduledTasks) task.stop();
  scheduledTasks = [];
  logger.info('Scheduled jobs stopped');
}
