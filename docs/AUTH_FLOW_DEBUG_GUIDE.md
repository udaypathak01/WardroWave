# Authentication Flow Debugging Guide

## Problem: "Invalid token. Please log in again."

This error occurs when the Firebase ID token verification fails on the backend. This is typically caused by token timing issues or token validity problems.

---

## Root Causes & Fixes Applied

### 1. **Race Condition on Signup/Login**
**Issue**: Calling backend endpoints immediately after Firebase user creation when token might not be ready.

**Fix Applied**: 
- Added explicit `getIdToken(true)` calls to force token refresh
- Improved token availability checking in `api.js`
- Better error logging to identify where failures occur

### 2. **Missing Error Context**
**Issue**: Frontend errors weren't detailed enough to identify the real problem.

**Fix Applied**:
- Added console logging at each auth step to trace flow
- Enhanced error logging in API requests (especially 401 errors)
- Better error context includes token availability and error codes

### 3. **Token Not Available in API Module**
**Issue**: `auth.currentUser` might be null when API calls are made immediately after signup.

**Fix Applied**:
- Added try-catch for token retrieval with detailed logging
- Handles case where token can't be obtained
- Logs whether token is available for each request

---

## Auth Flow - How It Works Now

### Signup Flow
```
1. createUserWithEmailAndPassword()
   └─> [Auth] Firebase user created: <uid>

2. firebaseUpdateProfile() - set displayName
   └─> [Auth] Display name updated

3. getIdToken(true) - force refresh
   └─> [Auth] ID token obtained

4. api.auth.syncProfile()
   └─> Creates Firestore user doc + cart + wishlist
   └─> [Auth] Profile synced successfully
```

### Login Flow
```
1. signInWithEmailAndPassword()
   └─> [Auth] Signed in: <email>

2. getIdToken(true) - force refresh
   └─> [Auth] Token refreshed

3. onAuthStateChanged triggers
   └─> [Auth] Auth state changed - fetching user profile: <uid>

4. api.auth.getMe()
   └─> [Auth] User profile loaded
```

### Token Injection in API Calls
```javascript
// Each API request:
1. Gets fresh token: auth.currentUser.getIdToken(true)
2. Sets header: Authorization: Bearer <token>
3. Backend verifies: getAuth().verifyIdToken(idToken)
4. Loads user from Firestore
```

---

## Debugging Checklist

### Step 1: Check Browser Console
Look for `[Auth]` log messages in order:

**For Signup:**
```
[Auth] Firebase user created: <uid>
[Auth] Display name updated
[Auth] ID token obtained
[Auth] Profile synced successfully
```

**For Login:**
```
[Auth] Signed in: <email>
[Auth] Token refreshed
[Auth] Auth state changed - fetching user profile: <uid>
[Auth] User profile loaded
```

### Step 2: Check Network Tab
- Look at POST request to `/api/auth/sync-profile` or `/api/auth/me`
- Check that header has: `Authorization: Bearer <long_token_string>`
- Check response status (should be 200, not 401)

### Step 3: Check Backend Logs
- Look for token verification errors
- Server should log middleware auth checks
- Check if Firestore write is succeeding

### Step 4: If You See 401 Error
The console will show:
```
[Auth Error] /api/auth/sync-profile:
  status: 401
  message: 'Invalid token. Please log in again.'
  hasToken: <true/false>
  code: 'auth/argument-error' or 'auth/id-token-revoked'
```

---

## Common Causes & Solutions

### Token is `null` (`hasToken: false`)
**Cause**: `auth.currentUser` is null when API is called
**Solution**:
- Wait a bit longer before making API call
- Ensure Firebase is initialized before using auth
- Check Firebase config in `src/config/firebase.js`

### Token is present but verification fails (`hasToken: true`, status 401)
**Cause**: Token is malformed or revoked
**Solutions**:
1. Clear browser localStorage/sessionStorage
2. Sign out completely and sign back in
3. Check if Firebase token lifetime is set (default 1 hour)
4. Ensure backend Firebase credentials are valid

### Backend Can't Verify Token
**Cause**: Firebase SDK initialization issue on backend
**Solution**:
1. Check `/backend/config/firebase.js` initialization
2. Verify `FIREBASE_PRIVATE_KEY` env var is set correctly
3. Restart backend server

---

## Environment Variables to Check

### Frontend (.env.local)
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### Backend (.env)
```
FIREBASE_PRIVATE_KEY=...
FIREBASE_PROJECT_ID=...
FIREBASE_DATABASE_URL=...
FIREBASE_STORAGE_BUCKET=...
```

---

## File References

- **Frontend Auth**: [src/context\ api/AuthContext.jsx](./src/context%20api/AuthContext.jsx)
- **API Handler**: [src/utils/api.js](./src/utils/api.js)
- **Backend Middleware**: [backend/middleware/auth.js](./backend/middleware/auth.js)
- **Auth Routes**: [backend/routes/authRoutes.js](./backend/routes/authRoutes.js)
- **Auth Controller**: [backend/controllers/authController.js](./backend/controllers/authController.js)

---

## Testing the Flow

### Manual Test: Signup
1. Open DevTools Console
2. Go to signup page
3. Fill form and submit
4. Watch the `[Auth]` logs in console
5. Check if profile loads after signup

### Manual Test: Login
1. Open DevTools Console
2. Go to login page
3. Enter credentials and submit
4. Watch the `[Auth]` logs in console
5. Check if profile loads after login

### Script Test: Check Current Token
```javascript
// In browser console:
firebase.auth().currentUser?.getIdToken(true)
  .then(token => console.log('Token:', token.substring(0, 20) + '...'))
  .catch(err => console.log('Error:', err))
```

---

## Recent Updates

✅ Added detailed console logging for auth flow
✅ Improved token refresh logic
✅ Better error context in API module (401 errors now include token status)
✅ Fixed social login error handling
✅ Auto sign-out on invalid token in onAuthStateChanged

---

## Next Steps If Still Seeing Error

1. **Install monitoring**: Add Sentry or similar to catch frontend errors
2. **Add request interceptor**: Log all auth-related requests/responses
3. **Backend monitoring**: Add detailed auth logging to backend
4. **Token lifecycle**: Review how tokens expire and refresh
5. **CORS issues**: Check if CORS headers might be stripping auth header

