# 🔍 Virtual Closet - Debugging Guide

## If Virtual Closet is loading but not displaying data...

### ✅ Things to Check

#### 1. **Browser Console - Check for Errors**
Open DevTools (F12) → Console tab and look for:
- ❌ Red error messages?
- 🔐 Auth token issues?
- 📡 Network errors?

#### 2. **Verify You're Logged In**
The Virtual Closet requires authentication:
- Log into Your Profile page first
- Check if "Sign In" appears (means not logged in)
- If not logged in properly, API will reject requests with 401 error

#### 3. **Check Backend is Running**
Backend must be running on port 5000:
```powershell
# From project root
cd backend
npm run dev
```

Should show:
```
🌊 WardroWave Backend  —  v2.0.0
🚀 Server:    http://localhost:5000
```

#### 4. **Network Tab Check**
DevTools → Network tab:
- Reload page
- Look for API calls to `http://localhost:5000/api/virtual-closet`
- Check response status:
  - ✅ 200 = Success
  - ⚠️ 401 = Not authenticated (need to log in)
  - ⚠️ 404 = Wrong URL
  - ⚠️ 500 = Server error

#### 5. **Console Logs to Look For**
With recent updates, you should see:
```
🔄 Loading Virtual Closet...
🔐 Getting Firebase auth token...
👤 User logged in: user@email.com
✅ Token retrieved successfully
📡 Fetching Virtual Closet from: http://localhost:5000/api/virtual-closet
📦 Response data: {success: true, data: {...}}
✅ Loaded looks: [...]
```

---

## 🚨 Common Issues & Fixes

### **"User not authenticated"**
**Problem:** Not logged in
**Fix:** 
1. Go to Login page
2. Enter email/password
3. Complete auth process
4. Then navigate to Profile → Virtual Closet

### **"Cannot GET /api/virtual-closet (404)"**
**Problem:** Backend not running on port 5000
**Fix:**
```powershell
cd backend
npm run dev
```

### **"Failed to load your closet"**
**Problem:** Could be several issues
**Check:**
1. Is user logged in? (look for 401 errors in console)
2. Is backend running? (look for network errors)
3. Check backend console for error details
4. Do you have Firebase credentials in backend .env? (FIREBASE_PROJECT_ID, etc.)

### **"TypeError: Cannot read property 'currentUser' of undefined"**
**Problem:** Firebase not properly initialized
**Fix:**
1. Check `src/config/firebase.js` is loading
2. Verify Firebase credentials in file
3. Restart the dev server

### **"CloudinaryError: Missing credentials"**
**Problem:** Not needed for loading (only for upload)
**Note:** This appears when uploading, not when loading

---

## 🔧 Testing Steps

### Step 1: Verify Backend
```bash
# Check if backend is running
curl http://localhost:5000/health

# Should respond with:
# {"success": true, "message": "🚀 WardroWave API is running", ...}
```

### Step 2: Verify Authentication
```javascript
// Open browser console and paste:
import { auth } from './src/config/firebase.js';
auth.currentUser
// Should show user object if logged in
```

### Step 3: Test API Directly
```javascript
// In browser console (if logged in):
const token = await auth.currentUser.getIdToken();
fetch('http://localhost:5000/api/virtual-closet', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(console.log)
```

---

## 📋 Checklist Before Declaring Issue

- [ ] Logged in to app?
- [ ] Backend running (`npm run dev` in `./backend`)?
- [ ] No console errors? (F12)
- [ ] Network shows 200/2xx status? (DevTools → Network)
- [ ] Can see console logs like "Loading Virtual Closet..."?
- [ ] Firebase config has credentials?
- [ ] Backend .env has FIREBASE_* variables?

---

## 📞 Still Having Issues?

Copy this info to help debug:
1. **Browser console errors** (F12)
2. **Network tab status codes**
3. **Console logs** showing auth/API calls
4. **Backend logs** (check terminal)
5. **User authentication status** (logged in?)

---

## 🚀 Once It's Working

You should see:
- ✅ "Loading your closet..." message
- ✅ Grid of saved looks (empty if first time)
- ✅ "New AI Try-On" button works
- ✅ Upload progress appears
- ✅ New images appear in grid

---

**Need help? Check the logs! 🔍**
