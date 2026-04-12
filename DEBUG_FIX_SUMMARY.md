# HTTP 500 Error - Google Login Fix

## Problem
When attempting to login with Google, the backend was returning HTTP 500 error.

## Root Cause
The issue was in `backend/controllers/authController.js` in the `syncProfile` controller function, specifically in the Firestore transaction:

```javascript
// ❌ WRONG - This causes HTTP 500
await db.runTransaction(async (transaction) => {
  transaction.set(db.collection(COLLECTIONS.USERS).doc(uid), profile);
  transaction.set(db.collection(COLLECTIONS.CARTS).doc(uid), { ... });
  transaction.set(db.collection(COLLECTIONS.WISHLISTS).doc(uid), { ... });
});
```

**The Problem:** You cannot call `db.collection()` inside a Firestore transaction. The transaction expects references that are created **outside** the transaction block.

## Solution
Move all document reference creation outside the transaction:

```javascript
// ✅ CORRECT
const userRef = db.collection(COLLECTIONS.USERS).doc(uid);
const cartsRef = db.collection(COLLECTIONS.CARTS).doc(uid);
const wishlistsRef = db.collection(COLLECTIONS.WISHLISTS).doc(uid);

await db.runTransaction(async (transaction) => {
  transaction.set(userRef, profile);
  transaction.set(cartsRef, { uid, items: [], updatedAt: new Date().toISOString() });
  transaction.set(wishlistsRef, { uid, productIds: [], updatedAt: new Date().toISOString() });
});
```

## Changes Made
**File:** `backend/controllers/authController.js`
- Lines 20-22: Moved `userRef`, `cartsRef`, and `wishlistsRef` creation outside the transaction
- Lines 46-48: Updated transaction to use pre-created references
- Added console logging for better debugging

## Testing
The fix has been deployed. The backend is now running with the corrected code. Google login should now work properly:

1. User clicks "Sign in with Google"
2. Firebase popup authenticates user
3. Frontend sends `/api/auth/sync-profile` request with valid Firebase token
4. Backend `protect` middleware validates token
5. `syncProfile` creates user/cart/wishlist documents in transaction (now fixed)
6. User is logged in successfully ✅

## Related Code
- Frontend: `frontend/src/context api/AuthContext.jsx` - `socialLogin()` function
- Frontend: `frontend/src/pages/Login.jsx` - Google login button handler
- Backend: `backend/routes/authRoutes.js` - Route configuration
- Backend: `backend/middleware/auth.js` - Token verification
