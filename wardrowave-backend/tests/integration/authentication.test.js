import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import { env } from '../../src/config/env.js';
import { createApp } from '../../src/app.js';
import { createUser } from '../helpers/factories.js';
import { mockFirebaseAuth } from '../helpers/providerMocks.js';
import { User } from '../../src/models/User.js';

const enabled = process.env.RUN_MONGO_INTEGRATION === 'true';
const integrationIt = enabled ? it : it.skip;
const app = createApp();
let originalAdminEmails;
let originalSuperadminEmails;
let firebaseAuthMocks;

beforeAll(() => {
  if (!enabled) return;
  originalAdminEmails = env.ADMIN_EMAILS;
  originalSuperadminEmails = env.SUPERADMIN_EMAILS;
  env.ADMIN_EMAILS = 'admin@example.test';
  env.SUPERADMIN_EMAILS = 'superadmin@example.test';
  firebaseAuthMocks = mockFirebaseAuth(async (token) => {
    if (token === 'invalid-token') throw new Error('Invalid Firebase token');
    if (token === 'admin-bootstrap') {
      return {
        uid: 'firebase-admin-bootstrap',
        email: 'admin@example.test',
        email_verified: true,
        name: 'Bootstrapped Admin',
      };
    }
    if (token === 'superadmin-bootstrap') {
      return {
        uid: 'firebase-superadmin-bootstrap',
        email: 'superadmin@example.test',
        email_verified: true,
        name: 'Bootstrapped Superadmin',
      };
    }
    if (token === 'existing-superadmin') {
      return {
        uid: 'existing-superadmin',
        email: 'superadmin@example.test',
        email_verified: true,
        name: 'Existing Superadmin',
      };
    }
    return { uid: token, email_verified: true };
  });
});

describe('Firebase authentication integration', () => {
  integrationIt('rejects missing and invalid tokens and unsynchronized accounts', async () => {
    const missing = await request(app).get('/api/v1/users/me');
    expect(missing.status).toBe(401);
    expect(missing.body.error.code).toBe('UNAUTHENTICATED');

    const invalid = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', 'Bearer invalid-token');
    expect(invalid.status).toBe(401);

    const unsynced = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', 'Bearer unsynchronized-user');
    expect(unsynced.status).toBe(401);
    expect(unsynced.body.error.code).toBe('USER_NOT_SYNCED');
  });

  integrationIt('rejects blocked accounts and bootstraps configured administrators by verified email', async () => {
    const blockedUser = await createUser({
      firebaseUid: 'blocked-user',
      status: 'blocked',
    });
    const blocked = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${blockedUser.firebaseUid}`);
    expect(blocked.status).toBe(403);
    expect(blocked.body.error.code).toBe('ACCOUNT_BLOCKED');

    const synced = await request(app)
      .post('/api/v1/auth/sync')
      .set('Authorization', 'Bearer admin-bootstrap');
    expect(synced.status).toBe(200);
    expect(synced.body.data.user.role).toBe('admin');

    const superadmin = await request(app)
      .post('/api/v1/auth/sync')
      .set('Authorization', 'Bearer superadmin-bootstrap');
    expect(superadmin.status).toBe(200);
    expect(superadmin.body.data.user.role).toBe('superadmin');
    expect(firebaseAuthMocks.setCustomUserClaims)
      .toHaveBeenCalledWith('firebase-superadmin-bootstrap', { role: 'superadmin' });
  });

  integrationIt('demotes an administrator when their verified email is no longer authorized', async () => {
    const adminUser = await createUser({
      firebaseUid: 'existing-admin-with-removed-access',
      email: 'admin@example.test',
      role: 'admin',
    });

    const response = await request(app)
      .post('/api/v1/auth/sync')
      .set('Authorization', 'Bearer existing-admin-with-removed-access');

    expect(response.status).toBe(200);
    expect(response.body.data.user.role).toBe('customer');
    await expect(User.findById(adminUser._id).lean())
      .resolves.toMatchObject({ role: 'customer' });
    expect(firebaseAuthMocks.setCustomUserClaims)
      .toHaveBeenCalledWith(adminUser.firebaseUid, {});
    expect(firebaseAuthMocks.revokeRefreshTokens)
      .toHaveBeenCalledWith(adminUser.firebaseUid);
  });

  integrationIt('demotes and revokes refresh tokens when a superadmin becomes an admin', async () => {
    const user = await createUser({
      firebaseUid: 'existing-superadmin',
      email: 'superadmin@example.test',
      role: 'superadmin',
    });
    const originalAdminEmails = env.ADMIN_EMAILS;
    const originalSuperadminEmails = env.SUPERADMIN_EMAILS;
    env.ADMIN_EMAILS = 'superadmin@example.test';
    env.SUPERADMIN_EMAILS = '';
    try {
      const response = await request(app)
        .post('/api/v1/auth/sync')
        .set('Authorization', 'Bearer existing-superadmin');

      expect(response.status).toBe(200);
      expect(response.body.data.user.role).toBe('admin');
      await expect(User.findById(user._id).lean()).resolves.toMatchObject({ role: 'admin' });
      expect(firebaseAuthMocks.setCustomUserClaims)
        .toHaveBeenCalledWith(user.firebaseUid, { role: 'admin' });
      expect(firebaseAuthMocks.revokeRefreshTokens).toHaveBeenCalledWith(user.firebaseUid);
    } finally {
      env.ADMIN_EMAILS = originalAdminEmails;
      env.SUPERADMIN_EMAILS = originalSuperadminEmails;
    }
  });

  integrationIt('does not resynchronize blocked or deleted accounts', async () => {
    await createUser({
      firebaseUid: 'blocked-sync-account',
      status: 'blocked',
    });
    await createUser({
      firebaseUid: 'deleted-sync-account',
      deletedAt: new Date(),
    });

    const blocked = await request(app)
      .post('/api/v1/auth/sync')
      .set('Authorization', 'Bearer blocked-sync-account');
    const deleted = await request(app)
      .post('/api/v1/auth/sync')
      .set('Authorization', 'Bearer deleted-sync-account');

    expect(blocked.status).toBe(403);
    expect(blocked.body.error.code).toBe('ACCOUNT_BLOCKED');
    expect(deleted.status).toBe(410);
    expect(deleted.body.error.code).toBe('ACCOUNT_DELETED');
  });
});

afterAll(() => {
  if (originalAdminEmails !== undefined) env.ADMIN_EMAILS = originalAdminEmails;
  if (originalSuperadminEmails !== undefined) env.SUPERADMIN_EMAILS = originalSuperadminEmails;
});
