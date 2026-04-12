const { getAuth, getDB } = require('../config/firebase');
const COLLECTIONS = require('../config/collections');

// ─── Verify Firebase ID Token ─────────────────────────────────────────────────
// Clients send the token from: firebase.auth().currentUser.getIdToken()
// Header: Authorization: Bearer <Firebase_ID_Token>

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('[Auth] ❌ No token provided - missing Authorization header');
      return res.status(401).json({
        success: false,
        message: 'Access token required. Please log in.',
      });
    }

    const idToken = authHeader.split('Bearer ')[1];
    console.log(`[Auth] 🔍 Verifying token: ${idToken.substring(0, 20)}...`);

    // Verify the Firebase ID token
    const decoded = await getAuth().verifyIdToken(idToken);
    console.log(`[Auth] ✅ Token verified for user: ${decoded.email} (${decoded.uid})`);

    // Attach decoded token (uid, email, name, etc.)
    req.firebaseUser = decoded;

    // Load the user profile from Firestore
    const db = getDB();
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(decoded.uid).get();

    if (!userDoc.exists) {
      console.log(`[Auth] 📝 First login - creating profile for ${decoded.uid}`);
      // First-time login: auto-create profile from Firebase token claims
      const newProfile = {
        uid: decoded.uid,
        email: decoded.email || '',
        fullName: decoded.name || decoded.email?.split('@')[0] || 'User',
        phone: decoded.phone_number || '',
        photoUrl: decoded.picture || '',
        gender: null,
        role: 'user',
        isActive: true,
        authProvider: decoded.firebase?.sign_in_provider || 'password',
        addresses: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await db.collection(COLLECTIONS.USERS).doc(decoded.uid).set(newProfile);
      req.user = newProfile;
    } else {
      const userData = userDoc.data();
      if (!userData.isActive) {
        console.warn(`[Auth] ⚠️  Account deactivated for ${decoded.uid}`);
        return res.status(401).json({ success: false, message: 'Your account has been deactivated.' });
      }
      req.user = userData;
    }

    next();
  } catch (error) {
    console.error(`[Auth] ❌ Verification failed:`, error.code, error.message);
    
    if (error.code === 'auth/id-token-expired') {
      console.warn('[Auth] Token expired - user needs to refresh');
      return res.status(401).json({ success: false, message: 'Token expired. Please log in again.', code: 'TOKEN_EXPIRED' });
    }
    if (error.code === 'auth/argument-error') {
      console.error('[Auth] Token format error - possibly malformed token:', {
        substring: error.message
      });
      return res.status(401).json({ success: false, message: 'Invalid token format. Please log in again.' });
    }
    if (error.code === 'auth/id-token-revoked') {
      console.warn('[Auth] Token revoked - user needs to re-authenticate');
      return res.status(401).json({ success: false, message: 'Invalid token. Please log in again.' });
    }
    
    console.error('[Auth] Unexpected error:', error);
    next(error);
  }
};

// ─── Optional Auth ────────────────────────────────────────────────────────────
// Attaches req.user if a valid token is present — doesn't block unauthenticated requests

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const idToken = authHeader.split('Bearer ')[1];
      const decoded = await getAuth().verifyIdToken(idToken);
      req.firebaseUser = decoded;

      const db = getDB();
      const userDoc = await db.collection(COLLECTIONS.USERS).doc(decoded.uid).get();
      if (userDoc.exists) req.user = userDoc.data();
    }
  } catch {
    // Silently ignore — optional auth
  }
  next();
};

// ─── Role Authorization ───────────────────────────────────────────────────────

const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Access denied. Must be: ${roles.join(' or ')}`,
    });
  }
  next();
};

module.exports = { protect, optionalAuth, authorize };
