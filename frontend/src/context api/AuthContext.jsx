import { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../config/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  FacebookAuthProvider, 
  signInWithPopup, 
  signOut,
  onAuthStateChanged,
  updateProfile as firebaseUpdateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import api from '../utils/api';

// ── Human-readable Firebase error messages ────────────────────────
function getFirebaseErrorMessage(code) {
  const map = {
    'auth/email-already-in-use':     'Email already in use',
    'auth/invalid-email':            'Please enter a valid email address.',
    'auth/weak-password':            'Password too weak',
    'auth/user-not-found':           'No account found with this email.',
    'auth/wrong-password':           'Incorrect password. Please try again.',
    'auth/too-many-requests':        'Too many attempts. Please try again later.',
    'auth/network-request-failed':   'Network error. Check your connection.',
    'auth/operation-not-allowed':    'Email/Password sign-in is not enabled in Firebase.',
    'auth/popup-closed-by-user':     'Sign-in popup was closed. Please try again.',
    'auth/popup-blocked':            'Popup was blocked by your browser. Allow popups and try again.',
    'auth/account-exists-with-different-credential': 'An account already exists with a different sign-in method.',
    'auth/cancelled-popup-request':  'Another sign-in popup is already open.',
  };
  return map[code] || null;
}

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showGenderModal, setShowGenderModal] = useState(false);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          console.log('[Auth] Auth state changed - fetching user profile:', firebaseUser.uid);
          // Fetch our DB profile to get roles and addresses
          const res = await api.auth.getMe();
          if (res && res.data && res.data.user) {
            console.log('[Auth] User profile loaded');
            setUser(res.data.user);
          } else {
            console.warn('Invalid user response from getMe:', res);
            setUser(null);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          // If token is invalid, sign out the user
          if (error.status === 401) {
            console.warn('[Auth] Token invalid, signing out');
            await signOut(auth);
          }
          setUser(null);
        }
      } else {
        console.log('[Auth] No authenticated user');
        setUser(null);
      }
      setIsLoading(false);
    });

    return unsubscribe; // Cleanup subscription on unmount
  }, []);

  // Sign up with email and password
  const signup = async (fullName, email, phone, password) => {
    try {
      // 1. Create Firebase user
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('[Auth] Firebase user created:', credential.user.uid);
      
      // 2. Set displayName in Firebase Auth so it's immediately available
      await firebaseUpdateProfile(credential.user, { displayName: fullName });
      console.log('[Auth] Display name updated');

      // 3. Force-refresh token so auth.currentUser has a valid token
      //    before we hit the backend (avoids the race condition)
      const token = await credential.user.getIdToken(true);
      console.log('[Auth] ID token obtained');

      // 4. Sync profile to backend (creates Firestore doc + cart + wishlist)
      const res = await api.auth.syncProfile({ fullName, phone });
      setUser(res.data.user);
      console.log('[Auth] Profile synced successfully');
      return res.data.user;
    } catch (err) {
      console.error("Signup error:", err);
      // Determine if it is a specific Firebase Auth error or another error like an Axios error
      const errorMessage =
        (err.code && getFirebaseErrorMessage(err.code)) ||
        err?.response?.data?.message ||
        err?.data?.message ||
        err.message ||
        "Something went wrong. Please try again.";
      throw new Error(errorMessage);
    }
  };

  // Login with email and password
  const login = async (email, password) => {
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      console.log('[Auth] Signed in:', credential.user.email);
      // Refresh token to ensure it's valid
      await credential.user.getIdToken(true);
      console.log('[Auth] Token refreshed');
      // onAuthStateChanged automatically fetches and sets the user profile
    } catch (err) {
      console.error("Login error:", err);
      const errorMessage =
        (err.code && getFirebaseErrorMessage(err.code)) ||
        err?.response?.data?.message ||
        err?.data?.message ||
        err.message ||
        "Something went wrong. Please try again.";
      throw new Error(errorMessage);
    }
  };

  // Social login (Google, Facebook)
  const socialLogin = async (providerName) => {
    let provider;
    if (providerName === 'google') provider = new GoogleAuthProvider();
    else if (providerName === 'facebook') provider = new FacebookAuthProvider();
    else throw new Error('Unsupported provider');

    try {
      // 1. Popup Firebase login
      const credential = await signInWithPopup(auth, provider);
      console.log('[Auth] Social login successful:', credential.user.email);
      // 2. Force token refresh before backend call
      await credential.user.getIdToken(true);
      console.log('[Auth] Token refreshed for social login');
      // 3. Sync profile (creates backend profile if first login)
      const res = await api.auth.syncProfile({});
      setUser(res.data.user);
      console.log('[Auth] Social login profile synced');
      return res.data.user;
    } catch (err) {
      console.error("Social login error:", err);
      const errorMessage =
        (err.code && getFirebaseErrorMessage(err.code)) ||
        err?.response?.data?.message ||
        err?.data?.message ||
        err.message ||
        "Something went wrong. Please try again.";
      throw new Error(errorMessage);
    }
  };

  // Logout
  const logout = async () => {
    try {
      await api.auth.logout(); // Optional: Revoke refresh tokens on server
    } catch (e) {
      // Ignore if server is down or token is invalid
    }
    await signOut(auth); // Clear Firebase local session
    setUser(null);
  };

  // Update user profile
  const updateProfile = async (updates) => {
    const res = await api.user.updateProfile(updates);
    setUser(res.data.user);
    return res.data.user;
  };

  // Reset password
  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      console.error("Password reset error:", err);
      const errorMessage =
        (err.code && getFirebaseErrorMessage(err.code)) ||
        err.message ||
        "Failed to send password reset email";
      throw new Error(errorMessage);
    }
  };

  const value = {
    user,
    isLoading,
    signup,
    login,
    socialLogin,
    logout,
    resetPassword,
    updateProfile,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {/* Wait for Firebase to determine auth state before rendering children so protected routes don't flash */}
      {!isLoading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
