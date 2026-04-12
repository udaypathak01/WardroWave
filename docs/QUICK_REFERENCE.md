# ⚡ QUICK REFERENCE CARD | WardroWave Project

## 🚀 One-Page Project Overview

### Project Type
**Fashion Rental Platform** - Rent clothes instead of buying

### Tech Stack
```
Frontend: React 18 + Vite + Tailwind CSS
Backend: Node.js + Express + Firebase
Database: Firestore (NoSQL)
Auth: Firebase Auth + Google OAuth
Images: Cloudinary
Hosting: Vercel
```

### Main Features
✅ Product browsing & search
✅ Virtual try-on (AI)
✅ Shopping cart & wishlist
✅ Order management
✅ Rental tracking
✅ Virtual closet
✅ Owner dashboard
✅ User profiles

---

## 📂 Project Structure Summary

```
Renclo/
├── src/                    Frontend (React)
│   ├── components/         Reusable UI (30+)
│   ├── pages/             Full pages (22)
│   ├── services/          API calls
│   ├── context api/       State management
│   ├── utils/             Helpers
│   ├── hooks/             Custom hooks
│   ├── config/            Firebase setup
│   └── Routers/           Route config
│
└── backend/               Backend (Express)
    ├── routes/            API endpoints (7 sets)
    ├── controllers/       Business logic (7)
    ├── middleware/        Request processing (3)
    ├── config/            Firebase & collections
    └── services/          Cloudinary upload
```

---

## 🔌 API Structure

### Base URL
- Dev: `http://localhost:5000/api`
- Prod: `https://your-backend.vercel.app/api`

### Authentication
```
Authorization: Bearer <FIREBASE_ID_TOKEN>
```

### Endpoints (7 Categories)
1. **Auth** (4 endpoints) - Login, signup, logout
2. **Users** (6 endpoints) - Profile, addresses
3. **Products** (6 endpoints) - Browse, search
4. **Cart** (5 endpoints) - Add, remove, checkout
5. **Orders** (6 endpoints) - Create, track, cancel
6. **Wishlist** (4 endpoints) - Add, remove, move
7. **Virtual Closet** (4 endpoints) - Create outfits

---

## 💾 Database Collections

```
users/          → User profiles & data
products/       → Product catalog
carts/          → Shopping carts
wishlists/      → Wishlist items
orders/         → Rental orders
reviews/        → Product reviews
virtualClosets/ → User outfits
```

---

## 📱 Key Routes

```
Frontend Routes:
/                    Home
/login              Login page
/signup             Registration
/products           Browse products
/products/:id       Product details
/cart               Shopping cart
/checkout           Checkout
/profile            User dashboard
/wishlist           Wishlist
/rentals            My rentals
/owner/dashboard    Owner panel
```

---

## 🎯 Common Tasks

### Add New Product (as Owner)
1. Frontend: Click "Add Product" → Fill form
2. Frontend: Upload images (Cloudinary)
3. Backend: POST `/api/products` called
4. Backend: Store in Firestore
5. Frontend: Show confirmation

### Rent Item (as User)
1. Frontend: Browse products
2. Frontend: Click item → Select dates → Add to cart
3. Frontend: Go to checkout
4. Backend: Create order
5. Backend: Update inventory
6. Frontend: Show confirmation

### Get User Profile
1. Frontend: User logs in
2. Backend: GET `/api/auth/me` called
3. Backend: Fetch from Firestore
4. Return user data
5. Frontend: Store in Context

---

## 🔐 Authentication Flow

```
User clicks "Login with Google"
    ↓
Firebase handles OAuth popup
    ↓
Frontend gets Firebase token
    ↓
Frontend calls POST `/api/auth/sync-profile`
    ↓
Backend creates/updates Firestore user doc
    ↓
Backend creates cart & wishlist
    ↓
Frontend stores user in AuthContext
    ↓
User redirected to home
```

---

## 📊 Response Format

### Success Response
```javascript
{
  success: true,
  data: { ... },
  message: "Operation successful"
}
```

### Error Response
```javascript
{
  success: false,
  message: "Error description",
  status: 400
}
```

---

## 🎨 Component Hierarchy

```
App
├── Header
├── Router
│   ├── Home
│   │   ├── Hero
│   │   ├── AiTryOn
│   │   ├── Stats
│   │   └── ...
│   ├── Products
│   │   ├── FilterSidebar
│   │   └── ProductGrid
│   │       └── ProductCard
│   ├── Cart
│   ├── Checkout
│   ├── UserProfile
│   ├── OwnerDashboard
│   └── ...
└── Footer
```

---

## 🔄 State Management

```
AuthContext
├── user
├── isLoading
├── signup()
├── login()
├── logout()
└── socialLogin()

CartContext
├── items
├── totalPrice
├── addToCart()
├── removeFromCart()
└── clearCart()

WishlistContext
├── items
├── addToWishlist()
├── removeFromWishlist()
└── moveToCart()
```

---

## 📡 API Call Pattern

```javascript
// Frontend
const response = await api.auth.syncProfile({
  fullName: 'John',
  phone: '9876543210'
})

// Uses src/utils/api.js
// Which attaches Firebase token
// Calls backend endpoint
// Handles errors
// Returns data
```

---

## 🛠️ Environment Variables

### Frontend (.env)
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_PROJECT_ID=wardrowave
VITE_API_URL=http://localhost:5000
```

### Backend (backend/.env)
```
PORT=5000
FIREBASE_PROJECT_ID=renclo
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...
CLOUDINARY_CLOUD_NAME=...
```

---

## 🧪 Testing Common Scenarios

### Test Login
1. Go to `/login`
2. Click "Google Login"
3. Select account
4. Should redirect to home
5. Check AuthContext has user

### Test Add to Cart
1. Browse products (`/products`)
2. Click product
3. Select dates & quantity
4. Click "Add to Cart"
5. Should appear in cart

### Test Checkout
1. Add items to cart
2. Go to `/cart`
3. Click "Checkout"
4. Enter address & payment
5. Submit order
6. Should see confirmation

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| DOCUMENTATION_INDEX.md | Navigation guide |
| PROJECT_DOCUMENTATION.md | Full overview |
| FRONTEND_GUIDE.md | Frontend details |
| BACKEND_GUIDE.md | Backend details |
| API_ROUTES_REFERENCE.md | API reference |
| DOCUMENTATION_SUMMARY.md | This summary |

---

## 🚨 Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| Invalid credentials | Check FIREBASE_CLIENT_EMAIL in backend/.env |
| CORS error | Update FRONTEND_URL in backend/.env |
| Images not uploading | Check Cloudinary credentials |
| Login not working | Verify Firebase config in frontend |
| API 404 errors | Check base URL in .env files |

---

## 🎓 Quick Start

### Frontend
```bash
npm install
npm run dev
# Opens http://localhost:5173
```

### Backend
```bash
cd backend
npm install
npm run dev
# Runs on http://localhost:5000
```

---

## 📈 Performance Tips

✅ Use React.memo for expensive components
✅ Lazy load pages with React.lazy()
✅ Optimize images with Cloudinary
✅ Paginate product lists
✅ Cache API responses
✅ Use debouncing for search

---

## 🔗 Key File Locations

| What | Where |
|------|-------|
| Frontend config | src/config/firebase.js |
| Backend config | backend/config/firebase.js |
| Routes | src/Routers/AppRoutes.jsx |
| API wrapper | src/utils/api.js |
| Auth logic | backend/controllers/authController.js |
| Product logic | backend/controllers/productController.js |

---

## 💾 Firestore Query Examples

```javascript
// Get all products
const products = await db.collection('products').get()

// Get product by ID
const product = await db.collection('products').doc(id).get()

// Filter products
const items = await db.collection('products')
  .where('category', '==', 'dress')
  .where('rentPrice', '<', 5000)
  .get()

// Add to cart
await db.collection('carts').doc(uid).update({
  items: firebase.firestore.FieldValue.arrayUnion(item)
})
```

---

## 🎯 User Roles

### Regular User
- Browse products
- Add to cart/wishlist
- Rent items
- Track rentals
- Create virtual closet

### Owner
- Add products
- Manage inventory
- View orders
- Track earnings
- See analytics

### Admin
- Manage users
- Manage products
- Process disputes
- View analytics

---

## 📞 Getting Help

**Issue with specific feature?**
→ Check FRONTEND_GUIDE.md or BACKEND_GUIDE.md

**Need API endpoint details?**
→ Check API_ROUTES_REFERENCE.md

**Lost in project structure?**
→ Check PROJECT_DOCUMENTATION.md

**Don't know where to start?**
→ Check DOCUMENTATION_INDEX.md

---

## ✅ Checklist Before Deployment

- [ ] Environment variables set
- [ ] Firebase credentials verified
- [ ] Cloudinary API keys configured
- [ ] FRONTEND_URL updated in backend
- [ ] VITE_API_URL set to production
- [ ] Firestore rules deployed
- [ ] CORS allowed for frontend domain
- [ ] Database backed up
- [ ] All tests passing
- [ ] Code reviewed

---

## 🚀 Deployment Steps

1. **Backend:**
   - Push to Vercel
   - Set environment variables
   - Deploy

2. **Frontend:**
   - Update .env.production
   - Run `npm run build`
   - Push to Vercel
   - Deploy

3. **Database:**
   - Update Firestore rules
   - Deploy rules

---

## 📊 Project Statistics

- 50+ files documented
- 40+ API endpoints
- 30+ components
- 22+ pages
- 7 Firestore collections
- 100+ code examples
- 15+ diagrams

---

## 🎓 Team Onboarding

1. Give new member DOCUMENTATION_INDEX.md
2. Ask them to read PROJECT_DOCUMENTATION.md
3. Based on role:
   - Frontend → FRONTEND_GUIDE.md
   - Backend → BACKEND_GUIDE.md
   - Full Stack → All guides
4. Have them review actual code
5. Assign first task

**Estimated onboarding time:** 6-8 hours

---

## 🏆 Best Practices

✅ Follow existing code patterns
✅ Use context for global state
✅ Keep components small
✅ Use Tailwind CSS utilities
✅ Handle errors gracefully
✅ Test before pushing
✅ Write clean code
✅ Comment complex logic
✅ Update documentation

---

**Quick Links:**
- 📖 [Start Here](./DOCUMENTATION_INDEX.md)
- 📖 [Project Overview](./PROJECT_DOCUMENTATION.md)
- 🎨 [Frontend Guide](./FRONTEND_GUIDE.md)
- ⚙️ [Backend Guide](./BACKEND_GUIDE.md)
- 🔌 [API Reference](./API_ROUTES_REFERENCE.md)

---

**Last Updated:** April 5, 2026
**Keep Handy:** Bookmark this file!
