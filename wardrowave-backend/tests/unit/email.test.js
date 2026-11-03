import { describe, expect, it } from '@jest/globals';
import { renderEmail } from '../../src/services/email.service.js';
import { env } from '../../src/config/env.js';

describe('transactional email templates', () => {
  it('renders escaped template content with the shared branded layout', () => {
    const email = renderEmail({
      template: 'welcome',
      context: { name: '<img src=x onerror=alert(1)>' },
    });

    expect(email.html).toContain('WardroWave');
    expect(email.html).toContain(env.SUPPORT_EMAIL);
    expect(email.html).toContain('&lt;img');
    expect(email.html).not.toContain('<img');
    expect(email.text).toContain('<img src=x onerror=alert(1)>');
  });

  it('provides HTML and plain-text variants for every supported lifecycle event', () => {
    const templates = [
      'welcome',
      'booking-confirmed',
      'payment-failed',
      'booking-expired',
      'booking-cancelled',
      'order-dispatched',
      'order-delivered',
      'start-reminder',
      'return-reminder',
      'overdue-notice',
      'return-received',
      'settlement',
      'refund-processed',
      'review-request',
      'admin-new-order',
      'admin-low-stock',
    ];

    for (const template of templates) {
      const email = renderEmail({ template, context: { bookingNumber: 'WW-TEST' } });
      expect(email.html).toContain('<!doctype html>');
      expect(email.text.length).toBeGreaterThan(0);
    }
  });

  it('rejects unknown templates explicitly', () => {
    expect(() => renderEmail({ template: 'unknown' })).toThrow('Unknown email template');
  });
});
