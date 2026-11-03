import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile as firebaseUpdateProfile,
  sendEmailVerification,
  reload,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { requireFirebaseAuth } from '../config/firebase';
import api from '../utils/api';

const AuthContext = createContext(null);

const firebaseErrorMessages = {
  'auth/email-already-in-use': 'Email already in use.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/user-not-found': 'No account found with this email.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/invalid-credential': 'Email or password is incorrect.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/too-many-requests': 'Too many attempts. Please try again later.',
  'auth/network-request-failed': 'Network error. Check your connection.',
  'auth/operation-not-allowed': 'This sign-in method is not enabled.',
  'auth/popup-closed-by-user': 'Sign-in popup was closed. Please try again.',
  'auth/popup-blocked': 'Popup was blocked by your browser. Allow popups and try again.',
  'auth/account-exists-with-different-credential':
    'An account already exists with a different sign-in method.',
  'auth/cancelled-popup-request': 'Another sign-in popup is already open.',
};

function authError(error) {
  return new Error(
    firebaseErrorMessages[error?.code]
      || error?.message
      || 'Something went wrong. Please try again.',
    { cause: error },
  );
}

function profileFromResponse(response) {
  const profile = response?.data?.user || response?.data;
  if (!profile?._id) {
    throw new Error('The backend returned an invalid user profile.');
  }
  return profile;
}

export function AuthProvider({ children }) {
  const auth = requireFirebaseAuth();
  const queryClient = useQueryClient();
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authErrorMessage, setAuthErrorMessage] = useState('');
  const profileSyncs = useRef(new Map());

  const syncProfile = useCallback((identity, phone) => {
    const existingSync = profileSyncs.current.get(identity.uid);
    if (existingSync) return existingSync;

    const pendingSync = (async () => {
      await identity.getIdToken(true);
      const digits = phone?.replace(/\D/g, '').replace(/^91/, '');
      const normalizedPhone = identity.phoneNumber
        || (digits?.length === 10 ? `+91${digits}` : undefined);
      const response = await api.auth.syncProfile({
        ...(normalizedPhone ? { phone: normalizedPhone } : {}),
      });
      return profileFromResponse(response);
    })();

    profileSyncs.current.set(identity.uid, pendingSync);
    return pendingSync.finally(() => {
      if (profileSyncs.current.get(identity.uid) === pendingSync) {
        profileSyncs.current.delete(identity.uid);
      }
    });
  }, []);

  const refreshProfile = useCallback(async () => {
    const identity = auth.currentUser;
    if (!identity) throw new Error('Sign in before refreshing your profile.');

    await reload(identity);
    const profile = await syncProfile(identity);
    setFirebaseUser(identity);
    setUser(profile);
    setAuthErrorMessage('');
    return profile;
  }, [auth, syncProfile]);

  useEffect(() => {
    let active = true;
    let activeUid = null;
    const unsubscribe = onAuthStateChanged(auth, async (identity) => {
      if (!active) return;
      setIsLoading(true);
      setAuthErrorMessage('');

      if (!identity) {
        activeUid = null;
        setFirebaseUser(null);
        setUser(null);
        queryClient.clear();
        setIsLoading(false);
        return;
      }

      activeUid = identity.uid;
      setFirebaseUser(identity);
      try {
        let response;
        try {
          response = await api.auth.getMe();
        } catch (error) {
          if (error.status !== 404 && error.code !== 'USER_NOT_SYNCED') throw error;
          const createdProfile = await syncProfile(identity);
          if (active && activeUid === identity.uid) setUser(createdProfile);
          return;
        }

        if (active && activeUid === identity.uid) setUser(profileFromResponse(response));
      } catch (error) {
        if (!active || activeUid !== identity.uid) return;
        setUser(null);
        if ([401, 403, 410].includes(error.status)) {
          setAuthErrorMessage(error.message);
          try {
            await signOut(auth);
          } catch {
            setAuthErrorMessage('Your session expired. Sign out and sign in again.');
          }
          return;
        }
        setAuthErrorMessage(
          'We could not load your account. Check your connection and try again.',
        );
      } finally {
        if (active && activeUid === identity.uid) setIsLoading(false);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [auth, queryClient, syncProfile]);

  const signup = async (fullName, email, phone, password) => {
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await firebaseUpdateProfile(credential.user, { displayName: fullName.trim() });
      await credential.user.getIdToken(true);
      const profile = await syncProfile(credential.user, phone);

      let emailVerificationSent = true;
      try {
        await sendEmailVerification(credential.user);
      } catch {
        emailVerificationSent = false;
      }

      setFirebaseUser(credential.user);
      setUser(profile);
      setAuthErrorMessage('');
      return { profile, emailVerificationSent };
    } catch (error) {
      throw authError(error);
    }
  };

  const login = async (email, password) => {
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      await reload(credential.user);
      const profile = await syncProfile(credential.user);
      setFirebaseUser(credential.user);
      setUser(profile);
      setAuthErrorMessage('');
      return profile;
    } catch (error) {
      throw authError(error);
    }
  };

  const socialLogin = async (providerName) => {
    const provider = providerName === 'google'
      ? new GoogleAuthProvider()
      : providerName === 'facebook'
        ? new FacebookAuthProvider()
        : null;
    if (!provider) throw new Error('Unsupported sign-in provider.');

    try {
      const credential = await signInWithPopup(auth, provider);
      await reload(credential.user);
      const profile = await syncProfile(credential.user);
      setFirebaseUser(credential.user);
      setUser(profile);
      setAuthErrorMessage('');
      return profile;
    } catch (error) {
      throw authError(error);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setFirebaseUser(null);
    setUser(null);
    setAuthErrorMessage('');
    queryClient.clear();
  };

  const resendVerificationEmail = async () => {
    const identity = auth.currentUser;
    if (!identity) throw new Error('Sign in before requesting a verification email.');
    await reload(identity);
    if (identity.emailVerified) {
      await refreshProfile();
      return false;
    }
    await sendEmailVerification(identity);
    return true;
  };

  const updateProfile = async (updates) => {
    const response = await api.user.updateProfile(updates);
    const profile = profileFromResponse(response);
    setUser(profile);
    return profile;
  };

  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw authError(error);
    }
  };

  const retryProfileLoad = async () => {
    setIsLoading(true);
    setAuthErrorMessage('');
    try {
      const profile = await refreshProfile();
      return profile;
    } catch (error) {
      if ([401, 403, 410].includes(error.status)) {
        try {
          await signOut(auth);
        } catch {
          setAuthErrorMessage('Your session expired. Sign out and sign in again.');
          return null;
        }
        setFirebaseUser(null);
        setUser(null);
        setAuthErrorMessage(error.message);
        return null;
      }
      setAuthErrorMessage(
        'We could not load your account. Check your connection and try again.',
      );
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    firebaseUser,
    isLoading,
    authError: authErrorMessage,
    isEmailVerified: Boolean(user?.emailVerified),
    isAuthenticated: Boolean(firebaseUser),
    signup,
    login,
    socialLogin,
    logout,
    resetPassword,
    updateProfile,
    refreshProfile,
    retryProfileLoad,
    resendVerificationEmail,
  };

  return (
    <AuthContext.Provider value={value}>
      {isLoading ? (
        <main
          role="status"
          aria-live="polite"
          className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
            <p className="text-sm font-medium text-gray-500">Checking your account...</p>
          </div>
        </main>
      ) : children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
