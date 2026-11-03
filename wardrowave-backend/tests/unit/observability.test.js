import { describe, expect, it, jest } from '@jest/globals';
import {
  captureException,
  configureObservability,
  recordMetric,
} from '../../src/utils/observability.js';

describe('optional observability hooks', () => {
  it('does nothing when disabled and no adapter is configured', () => {
    configureObservability(undefined);
    expect(() => captureException(new Error('test'))).not.toThrow();
    expect(() => recordMetric('test.metric', 1)).not.toThrow();
  });

  it('requires adapters to implement both reporting hooks', () => {
    expect(() => configureObservability({ captureException: jest.fn() }))
      .toThrow('Observability adapter must implement');
  });
});
