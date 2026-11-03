import { randomUUID } from 'node:crypto';
import { JobLock } from '../models/JobLock.js';
import { logger } from '../utils/logger.js';
import { captureException, recordMetric } from '../utils/observability.js';

const jobLogger = logger.child({ module: 'jobs' });

/**
 * Executes a job only after acquiring its distributed Mongo-backed lock.
 */
export async function runWithJobLock(name, durationMs, task) {
  const now = new Date();
  const startedAt = Date.now();
  const lockedBy = randomUUID();
  let lock;
  try {
    lock = await JobLock.findOneAndUpdate(
      { name, lockedUntil: { $lte: now } },
      { $set: { lockedUntil: new Date(now.getTime() + durationMs), lockedBy } },
      { new: true, upsert: true }
    ).exec();
  } catch (error) {
    if (error.code === 11000) return false;
    throw error;
  }
  if (!lock || lock.lockedBy !== lockedBy) {
    jobLogger.debug({ job: name }, 'Scheduled job skipped because another instance holds the lock');
    return false;
  }

  try {
    const result = await task();
    jobLogger.info(
      { job: name, durationMs: Date.now() - startedAt, result },
      'Scheduled job completed'
    );
    recordMetric('scheduled_job.duration_ms', Date.now() - startedAt, { job: name, status: 'completed' });
    return true;
  } catch (error) {
    jobLogger.error(
      { err: error, job: name, durationMs: Date.now() - startedAt },
      'Scheduled job failed'
    );
    recordMetric('scheduled_job.duration_ms', Date.now() - startedAt, { job: name, status: 'failed' });
    captureException(error, { job: name });
    return false;
  } finally {
    await JobLock.updateOne(
      { _id: lock._id, lockedBy },
      { $set: { lockedUntil: new Date(), lockedBy: 'released' } }
    ).exec();
  }
}
