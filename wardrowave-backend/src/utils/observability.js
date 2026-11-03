import { env } from '../config/env.js';
import { logger } from './logger.js';

let adapter;

/**
 * Registers an optional Sentry/Prometheus-compatible adapter.
 */
export function configureObservability(value) {
  if (
    value !== undefined &&
    (typeof value?.captureException !== 'function' || typeof value?.recordMetric !== 'function')
  ) {
    throw new TypeError('Observability adapter must implement captureException and recordMetric');
  }
  adapter = value;
}

/**
 * Optional external error-reporting hook; a disabled or unconfigured integration is a no-op.
 */
export function captureException(error, context = {}) {
  if (!env.OBSERVABILITY_ENABLED || !adapter) return;
  try {
    adapter.captureException(error, context);
  } catch (adapterError) {
    logger.error({ err: adapterError, ...context }, 'Observability adapter failed to capture an exception');
  }
}

/**
 * Optional external metrics hook; a disabled or unconfigured integration is a no-op.
 */
export function recordMetric(name, value, labels = {}) {
  if (!env.OBSERVABILITY_ENABLED || !adapter) return;
  try {
    adapter.recordMetric(name, value, labels);
  } catch (adapterError) {
    logger.error({ err: adapterError, metric: name }, 'Observability adapter failed to record a metric');
  }
}
