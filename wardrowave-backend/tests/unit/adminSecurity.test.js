import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { env } from '../../src/config/env.js';
import {
  authorize,
  requireMfa,
  requireRecentAuth,
  requireSuperadmin,
} from '../../src/middlewares/authorize.js';
import { logger } from '../../src/utils/logger.js';
import {
  hasRoleAtLeast,
  isAdminRole,
  isRoleDemotion,
} from '../../src/utils/roleHierarchy.js';

function runMiddleware(middleware, req) {
  return new Promise((resolve) => {
    middleware(req, {}, (error) => resolve(error));
  });
}

describe('admin security middleware', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('accepts a recently authenticated token and rejects stale or invalid auth_time claims', async () => {
    const now = Math.floor(Date.now() / 1000);
    const requestId = 'reauth-test-request';
    const loggerSpy = jest.spyOn(logger, 'info');
    const freshError = await runMiddleware(requireRecentAuth, {
      id: requestId,
      firebaseUser: { auth_time: now },
      user: { _id: 'admin-id' },
    });
    expect(freshError).toBeUndefined();

    const staleError = await runMiddleware(requireRecentAuth, {
      id: requestId,
      firebaseUser: { auth_time: now - env.ADMIN_REAUTH_MAX_AGE_SECONDS - 1 },
      user: { _id: 'admin-id' },
    });
    expect(staleError).toMatchObject({
      statusCode: 401,
      code: 'REAUTH_REQUIRED',
      details: { maxAgeSeconds: env.ADMIN_REAUTH_MAX_AGE_SECONDS },
    });
    expect(loggerSpy).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'REAUTH_REQUIRED', requestId }),
      'Admin security gate rejected request'
    );

    const invalidError = await runMiddleware(requireRecentAuth, {
      id: requestId,
      firebaseUser: { auth_time: 'recent' },
      user: { _id: 'admin-id' },
    });
    expect(invalidError).toMatchObject({ code: 'REAUTH_REQUIRED' });
  });

  it('requires a Firebase second-factor claim only when MFA policy is enabled', async () => {
    const originalPolicy = env.ADMIN_REQUIRE_MFA;
    try {
      env.ADMIN_REQUIRE_MFA = true;
      const missingFactor = await runMiddleware(requireMfa, {
        id: 'mfa-test-request',
        firebaseUser: {},
        user: { _id: 'superadmin-id' },
      });
      expect(missingFactor).toMatchObject({ statusCode: 403, code: 'MFA_REQUIRED' });

      expect(await runMiddleware(requireMfa, {
        firebaseUser: { firebase: { sign_in_second_factor: 'totp' } },
      })).toBeUndefined();

      env.ADMIN_REQUIRE_MFA = false;
      expect(await runMiddleware(requireMfa, { firebaseUser: {} })).toBeUndefined();
    } finally {
      env.ADMIN_REQUIRE_MFA = originalPolicy;
    }
  });

  it('uses the role hierarchy for admin routes while reserving critical actions for superadmins', async () => {
    expect(hasRoleAtLeast('superadmin', 'admin')).toBe(true);
    expect(hasRoleAtLeast('staff', 'admin')).toBe(false);
    expect(isAdminRole('superadmin')).toBe(true);
    expect(isAdminRole('customer')).toBe(false);
    expect(isRoleDemotion('superadmin', 'admin')).toBe(true);
    expect(isRoleDemotion('admin', 'staff')).toBe(true);
    expect(isRoleDemotion('admin', 'superadmin')).toBe(false);

    expect(await runMiddleware(authorize('admin'), { user: { role: 'superadmin' } }))
      .toBeUndefined();
    expect(await runMiddleware(authorize('staff', 'admin'), { user: { role: 'superadmin' } }))
      .toBeUndefined();
    expect(await runMiddleware(requireSuperadmin, { user: { role: 'admin' } }))
      .toMatchObject({ statusCode: 403 });
    expect(await runMiddleware(requireSuperadmin, { user: { role: 'superadmin' } }))
      .toBeUndefined();
  });
});
