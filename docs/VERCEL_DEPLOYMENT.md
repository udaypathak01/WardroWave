# Vercel Deployment - Environment Variables Setup

## ⚠️ SECURITY NOTICE

Your `.env` file contained sensitive credentials and was committed to the repository. **You must:**

1. ✅ **Rotate your exposed credentials immediately:**
   - Generate a new Firebase service account key
   - Regenerate Cloudinary API keys
   - These should never be committed to git again

2. ✅ **Update `.gitignore`** (already done)
   - `.env` files are now ignored

3. ✅ **Set environment variables in Vercel**
   - Add variables securely via Vercel Dashboard (not in code)

---

## 🚀 Steps to Deploy on Vercel

### Step 1: Set Environment Variables on Vercel

1. **Go to Vercel Dashboard:**
   - https://vercel.com/dashboard

2. **Select your project:** `wardrowave` (or create new)

3. **Go to Settings → Environment Variables**

4. **Add these variables** (values from your local `.env`):

| Variable | Value |
|----------|-------|
| `PORT` | `5000` |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | `https://your-vercel-domain.vercel.app` |
| `FIREBASE_PROJECT_ID` | `wardrowave` |
| `FIREBASE_CLIENT_EMAIL` | `firebase-adminsdk-fbsvc@wardrowave.iam.gserviceaccount.com` |
| `FIREBASE_PRIVATE_KEY` | Paste your private key (with newlines) |
| `CLOUDINARY_CLOUD_NAME` | `doiyd6zkx` |
| `CLOUDINARY_API_KEY` | Your API key |
| `CLOUDINARY_API_SECRET` | Your API secret |
| `RATE_LIMIT_WINDOW_MS` | `900000` |
| `RATE_LIMIT_MAX` | `200` |

**⚠️ IMPORTANT for FIREBASE_PRIVATE_KEY:**
- When pasting the private key in Vercel, keep the newlines as `\n` (literal backslash-n, not actual newlines)
- Example: `-----BEGIN PRIVATE KEY-----\nMIIEvg...\n-----END PRIVATE KEY-----\n`

### Step 2: Deploy Your Code

```bash
git add .gitignore
git commit -m "chore: add .env to gitignore for security"
git push origin main
```

Vercel should auto-deploy when you push to main.

### Step 3: Verify Backend is Running

```bash
# Check Vercel logs
# Dashboard → Your Project → Deployments → View Logs
```

You should see:
```
✅ Firebase Admin SDK initialized
✅ Cloudinary: Configuration valid
🚀 Server running
```

---

## 🔧 If You Get "Unexpected token 'A'" Error

This means **environment variables are missing** on Vercel. Check:

1. **Are all environment variables set in Vercel?**
   - Go to Settings → Environment Variables
   - Verify all 11 variables are present

2. **Is the FIREBASE_PRIVATE_KEY formatted correctly?**
   - Should include `\n` for newlines
   - Should NOT have actual line breaks in the value

3. **Check Vercel Logs:**
   - Dashboard → Deployments → Click deployment
   - View build and runtime logs
   - Look for Firebase initialization errors

4. **Common Issues:**
   - Missing `FIREBASE_PRIVATE_KEY` → Firebase init fails
   - Missing `CLOUDINARY_*` → Image upload fails
   - Wrong `FIREBASE_PROJECT_ID` → Auth fails

---

## 📋 Vercel Deployment Checklist

- [ ] Backend `.env` file added to `.gitignore`
- [ ] All environment variables added to Vercel
- [ ] FIREBASE_PRIVATE_KEY properly formatted with `\n`
- [ ] Code pushed to main branch
- [ ] Deployment completed successfully
- [ ] Check Vercel logs for no errors
- [ ] Test sign-in on deployed URL
- [ ] Test image upload to Virtual Closet

---

## 🚨 Security Best Practices

1. **Never commit `.env` files to git**
   - Use `.gitignore` to prevent accidents
   - Use `git rm --cached` if accidentally committed before

2. **Rotate exposed secrets immediately:**
   - Go to Firebase Console → Project Settings → Service Accounts
   - Generate a NEW private key
   - Update Vercel environment variable with new key

   - Go to Cloudinary Console → Settings → Security
   - Regenerate API keys
   - Update Vercel environment variables

3. **Use Vercel Environment Variables for all secrets**
   - Never hardcode credentials in code
   - Different values for dev/staging/production

---

## 📞 Need Help?

If you still get errors:

1. Check Vercel Logs: `Settings → Deployments → View Logs`
2. Look for Firebase initialization errors
3. Verify all env vars are set in Vercel console
4. Restart deployment: `Settings → Deployments → Redeploy`

**Let me know the specific error from the Vercel logs and I'll help debug!**
