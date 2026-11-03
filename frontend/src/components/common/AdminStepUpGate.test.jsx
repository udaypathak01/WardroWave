import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AdminStepUpGate from './AdminStepUpGate';
import { requestAdminStepUp } from '../../lib/api/adminStepUp';

const mocks = vi.hoisted(() => ({
  auth: { currentUser: null },
  reauthenticateWithCredential: vi.fn(),
  reauthenticateWithPopup: vi.fn(),
  getMultiFactorResolver: vi.fn(),
  resolveSignIn: vi.fn(),
}));

vi.mock('../../config/firebase', () => ({ auth: mocks.auth }));
vi.mock('firebase/auth', () => ({
  EmailAuthProvider: { credential: vi.fn(() => ({ providerId: 'password' })) },
  FacebookAuthProvider: class FacebookAuthProvider {},
  GoogleAuthProvider: class GoogleAuthProvider {},
  getMultiFactorResolver: mocks.getMultiFactorResolver,
  PhoneAuthProvider: class PhoneAuthProvider {},
  PhoneMultiFactorGenerator: {
    FACTOR_ID: 'phone',
    assertion: vi.fn((credential) => ({ credential })),
  },
  RecaptchaVerifier: class RecaptchaVerifier {
    clear() {}
  },
  reauthenticateWithCredential: mocks.reauthenticateWithCredential,
  reauthenticateWithPopup: mocks.reauthenticateWithPopup,
  TotpMultiFactorGenerator: {
    FACTOR_ID: 'totp',
    assertionForSignIn: vi.fn((uid, code) => ({ uid, code })),
  },
}));

describe('AdminStepUpGate', () => {
  afterEach(() => {
    mocks.auth.currentUser = null;
    mocks.reauthenticateWithCredential.mockReset();
    mocks.reauthenticateWithPopup.mockReset();
    mocks.getMultiFactorResolver.mockReset();
    mocks.resolveSignIn.mockReset();
  });

  it('reauthenticates with the linked password and completes the waiting request', async () => {
    const identity = {
      email: 'admin@example.com',
      providerData: [{ providerId: 'password' }],
      getIdTokenResult: vi.fn().mockResolvedValue({ claims: {} }),
    };
    mocks.auth.currentUser = identity;
    mocks.reauthenticateWithCredential.mockResolvedValue({});
    render(<AdminStepUpGate />);

    const waitingRequest = requestAdminStepUp('REAUTH_REQUIRED');
    fireEvent.change(await screen.findByLabelText('Account password'), {
      target: { value: 'correct horse battery staple' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Verify and continue' }));

    await expect(waitingRequest).resolves.toBeUndefined();
    expect(mocks.reauthenticateWithCredential).toHaveBeenCalledTimes(1);
    expect(identity.getIdTokenResult).toHaveBeenCalledWith(true);
  });

  it('resolves an enrolled TOTP factor before completing the waiting request', async () => {
    const identity = {
      email: 'admin@example.com',
      providerData: [{ providerId: 'password' }],
      getIdTokenResult: vi.fn().mockResolvedValue({
        claims: { firebase: { sign_in_second_factor: 'totp' } },
      }),
    };
    const resolver = {
      hints: [{ uid: 'totp-1', factorId: 'totp', displayName: 'Authenticator app' }],
      resolveSignIn: mocks.resolveSignIn,
    };
    mocks.auth.currentUser = identity;
    mocks.reauthenticateWithCredential.mockRejectedValue({
      code: 'auth/multi-factor-auth-required',
    });
    mocks.getMultiFactorResolver.mockReturnValue(resolver);
    mocks.resolveSignIn.mockResolvedValue({});
    render(<AdminStepUpGate />);

    const waitingRequest = requestAdminStepUp('MFA_REQUIRED');
    fireEvent.change(await screen.findByLabelText('Account password'), {
      target: { value: 'account-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Verify and continue' }));

    fireEvent.change(await screen.findByLabelText('Authenticator code'), {
      target: { value: '123456' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Verify and continue' }));

    await expect(waitingRequest).resolves.toBeUndefined();
    await waitFor(() => expect(mocks.resolveSignIn).toHaveBeenCalledTimes(1));
  });
});
