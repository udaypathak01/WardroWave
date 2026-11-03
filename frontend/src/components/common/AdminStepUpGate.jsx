import { useCallback, useEffect, useRef, useState } from 'react';
import {
  EmailAuthProvider,
  FacebookAuthProvider,
  GoogleAuthProvider,
  getMultiFactorResolver,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  RecaptchaVerifier,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  TotpMultiFactorGenerator,
} from 'firebase/auth';
import { LockKeyhole, ShieldCheck, X } from 'lucide-react';
import { auth } from '../../config/firebase';
import { registerAdminStepUpHandler } from '../../lib/api/adminStepUp';

function isMultiFactorError(error) {
  return error?.code === 'auth/multi-factor-auth-required';
}

function isPhoneFactor(factor) {
  return factor?.factorId === PhoneMultiFactorGenerator.FACTOR_ID;
}

function isTotpFactor(factor) {
  return factor?.factorId === TotpMultiFactorGenerator.FACTOR_ID;
}

function readableAuthError(error) {
  const messages = {
    'auth/wrong-password': 'That password is incorrect. Try again.',
    'auth/invalid-credential': 'That sign-in credential is invalid. Try again.',
    'auth/invalid-verification-code': 'That verification code is incorrect or expired.',
    'auth/code-expired': 'That verification code has expired. Send a new one.',
    'auth/too-many-requests': 'Too many attempts. Wait a moment and try again.',
    'auth/popup-closed-by-user': 'The sign-in window was closed before verification completed.',
    'auth/popup-blocked': 'Allow popups in your browser and try again.',
  };
  return messages[error?.code] || 'We could not verify your identity. Please try again.';
}

export default function AdminStepUpGate() {
  const [challenge, setChallenge] = useState(null);
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [resolver, setResolver] = useState(null);
  const [factorUid, setFactorUid] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const recaptchaContainer = useRef(null);
  const recaptchaVerifier = useRef(null);

  const startChallenge = useCallback((reason) => new Promise((resolve, reject) => {
    setPassword('');
    setCode('');
    setErrorMessage('');
    setResolver(null);
    setFactorUid('');
    setVerificationId('');
    setChallenge({ reason, resolve, reject });
  }), []);

  useEffect(
    () => registerAdminStepUpHandler(startChallenge),
    [startChallenge],
  );

  useEffect(() => () => {
    recaptchaVerifier.current?.clear();
    recaptchaVerifier.current = null;
  }, []);

  const closeChallenge = useCallback((reason) => {
    const activeChallenge = challenge;
    setChallenge(null);
    setResolver(null);
    setVerificationId('');
    setPassword('');
    setCode('');
    recaptchaVerifier.current?.clear();
    recaptchaVerifier.current = null;
    if (activeChallenge) activeChallenge.reject(reason);
  }, [challenge]);

  const completeChallenge = useCallback(async () => {
    const identity = auth?.currentUser;
    if (!identity) throw new Error('Your sign-in session has ended. Please sign in again.');

    const token = await identity.getIdTokenResult(true);
    const firebaseClaims = token.claims.firebase;
    if (
      challenge?.reason === 'MFA_REQUIRED'
      && (!firebaseClaims || typeof firebaseClaims.sign_in_second_factor !== 'string')
    ) {
      throw new Error(
        'Multi-factor authentication is required. Add a second factor to this account and try again.',
      );
    }

    const activeChallenge = challenge;
    setChallenge(null);
    setResolver(null);
    setVerificationId('');
    setPassword('');
    setCode('');
    recaptchaVerifier.current?.clear();
    recaptchaVerifier.current = null;
    activeChallenge?.resolve();
  }, [challenge]);

  const handleReauthentication = async (providerId) => {
    const identity = auth?.currentUser;
    if (!identity) {
      setErrorMessage('Your sign-in session has ended. Please sign in again.');
      return;
    }

    setBusy(true);
    setErrorMessage('');
    try {
      if (providerId === 'password') {
        if (!identity.email || !password) {
          setErrorMessage('Enter your account password to continue.');
          return;
        }
        await reauthenticateWithCredential(
          identity,
          EmailAuthProvider.credential(identity.email, password),
        );
      } else {
        const provider = providerId === 'google.com'
          ? new GoogleAuthProvider()
          : new FacebookAuthProvider();
        await reauthenticateWithPopup(identity, provider);
      }
      await completeChallenge();
    } catch (error) {
      if (isMultiFactorError(error)) {
        try {
          const nextResolver = getMultiFactorResolver(auth, error);
          const availableFactors = nextResolver.hints.filter(
            (factor) => isPhoneFactor(factor) || isTotpFactor(factor),
          );
          if (availableFactors.length === 0) {
            setErrorMessage('No supported second factor is enrolled on this account.');
            return;
          }
          setResolver(nextResolver);
          setFactorUid(availableFactors[0].uid);
          setCode('');
          setVerificationId('');
        } catch {
          setErrorMessage('We could not start multi-factor verification. Try again.');
        }
      } else {
        setErrorMessage(error?.message && !error?.code
          ? error.message
          : readableAuthError(error));
      }
    } finally {
      setBusy(false);
    }
  };

  const sendPhoneCode = async () => {
    if (!resolver || !auth || !recaptchaContainer.current) return;
    const factor = resolver.hints.find((hint) => hint.uid === factorUid);
    if (!isPhoneFactor(factor)) {
      setErrorMessage('Select a phone verification method.');
      return;
    }

    setBusy(true);
    setErrorMessage('');
    try {
      if (!recaptchaVerifier.current) {
        recaptchaVerifier.current = new RecaptchaVerifier(
          auth,
          recaptchaContainer.current,
          { size: 'invisible' },
        );
      }
      const provider = new PhoneAuthProvider(auth);
      const nextVerificationId = await provider.verifyPhoneNumber(
        { multiFactorHint: factor, session: resolver.session },
        recaptchaVerifier.current,
      );
      setVerificationId(nextVerificationId);
      setCode('');
    } catch (error) {
      setErrorMessage(readableAuthError(error));
    } finally {
      setBusy(false);
    }
  };

  const verifySecondFactor = async (event) => {
    event.preventDefault();
    if (!resolver || !code.trim()) return;

    const factor = resolver.hints.find((hint) => hint.uid === factorUid);
    setBusy(true);
    setErrorMessage('');
    try {
      let assertion;
      if (isPhoneFactor(factor)) {
        if (!verificationId) {
          setErrorMessage('Send a phone verification code first.');
          return;
        }
        const credential = PhoneAuthProvider.credential(verificationId, code.trim());
        assertion = PhoneMultiFactorGenerator.assertion(credential);
      } else if (isTotpFactor(factor)) {
        assertion = TotpMultiFactorGenerator.assertionForSignIn(factor.uid, code.trim());
      } else {
        setErrorMessage('Select a supported second factor.');
        return;
      }

      await resolver.resolveSignIn(assertion);
      await completeChallenge();
    } catch (error) {
      setErrorMessage(error?.message && !error?.code
        ? error.message
        : readableAuthError(error));
    } finally {
      setBusy(false);
    }
  };

  if (!challenge) return null;

  const identity = auth?.currentUser;
  const providers = new Set(identity?.providerData.map((provider) => provider.providerId) ?? []);
  const factors = resolver?.hints.filter(
    (factor) => isPhoneFactor(factor) || isTotpFactor(factor),
  ) ?? [];
  const selectedFactor = factors.find((factor) => factor.uid === factorUid);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 px-4 py-8">
      <section
        aria-label="Additional sign-in verification"
        aria-modal="true"
        className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:p-8"
        role="dialog"
      >
        <button
          aria-label="Cancel verification"
          className="absolute right-4 top-4 rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
          onClick={() => closeChallenge(new Error('Additional sign-in verification was cancelled.'))}
          type="button"
        >
          <X aria-hidden="true" size={18} />
        </button>

        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
          {resolver
            ? <ShieldCheck aria-hidden="true" size={24} />
            : <LockKeyhole aria-hidden="true" size={24} />}
        </div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          Verify it&apos;s you
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {challenge.reason === 'MFA_REQUIRED'
            ? 'A second factor is required to continue this sensitive action.'
            : 'Please verify your identity again to continue this sensitive action.'}
        </p>

        {errorMessage && (
          <p aria-live="polite" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300" role="alert">
            {errorMessage}
          </p>
        )}

        {resolver ? (
          <form className="mt-5 space-y-4" onSubmit={verifySecondFactor}>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Verification method
              <select
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                onChange={(event) => {
                  setFactorUid(event.target.value);
                  setVerificationId('');
                  setCode('');
                  setErrorMessage('');
                }}
                value={factorUid}
              >
                {factors.map((factor) => (
                  <option key={factor.uid} value={factor.uid}>
                    {isPhoneFactor(factor)
                      ? `Text message ending in ${factor.phoneNumber.slice(-4)}`
                      : factor.displayName || 'Authenticator app'}
                  </option>
                ))}
              </select>
            </label>

            {isPhoneFactor(selectedFactor) && !verificationId && (
              <button
                className="w-full rounded-lg border border-violet-300 px-4 py-2.5 text-sm font-semibold text-violet-700 transition hover:bg-violet-50 disabled:opacity-60 dark:border-violet-500/50 dark:text-violet-300 dark:hover:bg-violet-500/10"
                disabled={busy}
                onClick={sendPhoneCode}
                type="button"
              >
                {busy ? 'Sending code...' : 'Send verification code'}
              </button>
            )}

            {(isTotpFactor(selectedFactor) || verificationId) && (
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                {isPhoneFactor(selectedFactor) ? 'SMS verification code' : 'Authenticator code'}
                <input
                  autoComplete="one-time-code"
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                  inputMode="numeric"
                  onChange={(event) => setCode(event.target.value)}
                  required
                  value={code}
                />
              </label>
            )}

            {(isTotpFactor(selectedFactor) || verificationId) && (
              <button
                className="w-full rounded-lg bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={busy || !code.trim()}
                type="submit"
              >
                {busy ? 'Verifying...' : 'Verify and continue'}
              </button>
            )}
            <div ref={recaptchaContainer} />
          </form>
        ) : (
          <div className="mt-5 space-y-4">
            {providers.has('password') && (
              <form
                className="space-y-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  handleReauthentication('password');
                }}
              >
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Account password
                  <input
                    autoComplete="current-password"
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    type="password"
                    value={password}
                  />
                </label>
                <button
                  className="w-full rounded-lg bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={busy || !password}
                  type="submit"
                >
                  {busy ? 'Verifying...' : 'Verify and continue'}
                </button>
              </form>
            )}

            {providers.has('google.com') && (
              <button
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                disabled={busy}
                onClick={() => handleReauthentication('google.com')}
                type="button"
              >
                Continue with Google
              </button>
            )}
            {providers.has('facebook.com') && (
              <button
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                disabled={busy}
                onClick={() => handleReauthentication('facebook.com')}
                type="button"
              >
                Continue with Facebook
              </button>
            )}
            {!providers.has('password') && !providers.has('google.com') && !providers.has('facebook.com') && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                This sign-in method cannot be reverified here. Sign out and use a supported sign-in method.
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
