# ⚙️ BACKEND STRUCTURE & DOCUMENTATION | WardroWave

## 📋 Backend Overview

**Technology Stack:**
- Node.js + Express
- Firebase Firestore (Database)
- Firebase Admin SDK (Auth)
- Cloudinary (Image uploads)
- Vercel (Deployment)

**Main Purpose:**
Handle all business logic, database operations, authentication, and API endpoints.

---

## 📂 BACKEND FOLDER STRUCTURE

```
backend/
├── server.js              # Express app setup
├── package.json           # Dependencies
├── .env                   # Environment variables
│
├── config/
│   ├── firebase.js        # Firebase Admin SDK
│   └── collections.js     # Firestore collection names
│
├── routes/                # API endpoint definitions
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── productRoutes.js
│   ├── cartRoutes.js
│   ├── orderRoutes.js
│   ├── wishlistRoutes.js
│   └── virtualClosetRoutes.js
│
├── controllers/           # Business logic
│   ├── authController.js
│   ├── userController.js
│   ├── productController.js
│   ├── cartController.js
│   ├── orderController.js
│   ├── wishlistController.js
│   └── virtualClosetController.js
│
├── middleware/            # Request processing
│   ├── auth.js            # JWT verification
│   ├── errorHandler.js    # Error handling
│   └── fileUpload.js      # File upload handling
│
├── services/
│   └── cloudinaryService.js  # Image uploads
│
└── scripts/
    └── seed.js            # Database seeding
```

---

## 🚀 SERVER.JS - Main Application File

**Purpose:** Sets up Express app with middleware and routes.

**Key Setup:**
```javascript
require('dotenv').config()           // Load env vars
const express = require('express')   // Framework
const cors = require('cors')         // Cross-origin
const helmet = require('helmet')     // Security
const rateLimit = require('express-rate-limit')  // Rate limiting
```

**Middleware:**
```javascript
app.use(helmet())                    // Security headers
app.use(cors({...}))                // Allow frontend origin
app.use(express.json())             // Parse JSON
app.use(cookieParser())             // Parse cookies
app.use(morgan('dev'))              // Logging
app.use(rateLimiter)                // Rate limiting
```

**Routes:**
```javascript
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/products', productRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/wishlist', wishlistRoutes)
app.use('/api/virtual-closet', virtualClosetRoutes)
```

**Error Handling:**
```javascript
app.use(notFound)          // 404 handler
app.use(errorHandler)      // Error middleware
```

---

## ⚙️ CONFIG FOLDER

### **firebase.js**
Firebase Admin SDK initialization.

**Functions:**
```javascript
initFirebase()              // Initialize Firebase
getDB()                    // Get Firestore instance
getAuth()                  // Get Auth instance
getStorage()               // Get Storage instance
```

**Usage:**
```javascript
const { getDB, getAuth } = require('../config/firebase')
const db = getDB()
const auth = getAuth()
```

---

### **collections.js**
Firestore collection name constants.

**Collections:**
```javascript
module.exports = {
  USERS: 'users',
  PRODUCTS: 'products',
  CARTS: 'carts',
  WISHLISTS: 'wishlists',
  ORDERS: 'orders',
  REVIEWS: 'reviews',
  VIRTUAL_CLOSETS: 'virtualClosets',
  ADDRESSES: 'addresses'
}
```

---

## 🔀 ROUTES FOLDER

API endpoint definitions. Each file exports Express Router.

### **authRoutes.js**
Authentication endpoints.

**Endpoints:**
```javascript
POST   /api/auth/sync-profile        // Create/update user profile
GET    /api/auth/me                  // Get current user
POST   /api/auth/logout              // Logout & revoke token
DELETE /api/auth/delete-account      // Delete account
```

**Flow:**
1. User signs up via Firebase
2. Frontend calls `/sync-profile`
3. Backend creates Firestore doc + cart + wishlist
4. Returns user object

---

### **userRoutes.js**
User management endpoints.

**Endpoints:**
```javascript
GET    /api/users/profile            // Get user profile
PUT    /api/users/profile            // Update profile
GET    /api/users/addresses          // Get addresses
POST   /api/users/addresses          // Add address
PUT    /api/users/addresses/:id      // Update address
DELETE /api/users/addresses/:id      // Delete address
GET    /api/users/:id/rentals        // Get user rentals
```

---

### **productRoutes.js**
Product management endpoints.

**Endpoints:**
```javascript
GET    /api/products                 // List all products
GET    /api/products/featured        // Get featured
GET    /api/products/:id             // Get single product
POST   /api/products                 // Create (owner only)
PUT    /api/products/:id             // Update
DELETE /api/products/:id             // Delete
GET    /api/products/category/:cat   // By category
GET    /api/products/search          // Search
```

**Query Params:**
```javascript
?category=dress&size=M&priceMax=5000&sort=price
```

---

### **cartRoutes.js**
Shopping cart endpoints.

**Endpoints:**
```javascript
GET    /api/cart                     // View cart
POST   /api/cart/add                 // Add item
PUT    /api/cart/:productId          // Update quantity
DELETE /api/cart/:productId          // Remove item
POST   /api/cart/clear               // Clear cart
```

**Request Body Example:**
```javascript
{
  productId: "prod123",
  quantity: 2,
  rentalStartDate: "2024-04-10",
  rentalEndDate: "2024-04-15"
}
```

---

### **orderRoutes.js**
Order processing endpoints.

**Endpoints:**
```javascript
POST   /api/orders                   // Create order
GET    /api/orders                   // User's orders
GET    /api/orders/:id               // Single order
PUT    /api/orders/:id               // Update status
DELETE /api/orders/:id               // Cancel order
GET    /api/orders/:id/tracking      // Track order
```

**Order Statuses:**
- `pending` → Payment processing
- `confirmed` → Order confirmed
- `shipped` → Item shipped
- `delivered` → Received by user
- `returned` → Item returned
- `completed` → Rental complete

---

### **wishlistRoutes.js**
Wishlist endpoints.

**Endpoints:**
```javascript
GET    /api/wishlist                 // Get wishlist
POST   /api/wishlist/add             // Add item
DELETE /api/wishlist/:productId      // Remove item
POST   /api/wishlist/move-to-cart    // Move to cart
```

---

### **virtualClosetRoutes.js**
Virtual closet endpoints.

**Endpoints:**
```javascript
GET    /api/virtual-closet           // Get all outfits
POST   /api/virtual-closet           // Create outfit
GET    /api/virtual-closet/:id       // Get outfit
PUT    /api/virtual-closet/:id       // Update outfit
DELETE /api/virtual-closet/:id       // Delete outfit
```

---

## 🎮 CONTROLLERS FOLDER

Business logic - handles the actual operations.

### **authController.js**
Authentication logic.

**Functions:**

#### `getMe()`
Get current user profile.
```javascript
// Route: GET /api/auth/me
// Returns: { success: true, data: { user } }
// Uses: req.user from auth middleware
```

#### `syncProfile(req, res)`
Create or update user profile after auth.
```javascript
// Route: POST /api/auth/sync-profile
// Body: { fullName, phone, photoUrl }
// Returns: { success: true, data: { user } }
// Creates: Firestore user doc, cart, wishlist
```

#### `logout(req, res)`
Logout and revoke tokens.
```javascript
// Route: POST /api/auth/logout
// Returns: { success: true, message: 'Logged out' }
// Actions: Revoke Firebase refresh token
```

#### `deleteAccount(req, res)`
Delete user account (soft delete).
```javascript
// Route: DELETE /api/auth/delete-account
// Returns: { success: true, message: 'Account deleted' }
// Actions: Set isActive: false in Firestore
```

---

### **userController.js**
User management logic.

**Functions:**

#### `getUserProfile()`
Get user information.
```javascript
// Returns: User doc with all fields
// Includes: email, fullName, phone, addresses, role
```

#### `updateProfile(req, res)`
Update user information.
```javascript
// Body: { fullName, phone, photoUrl }
// Returns: Updated user object
```

#### `getAddresses()`
Get all user addresses.
```javascript
// Returns: Array of address objects
```

#### `addAddress(req, res)`
Add new address.
```javascript
// Body: { street, city, state, zipCode, isDefault }
// Returns: New address with ID
```

#### `updateAddress(req, res)`
Update existing address.
```javascript
// Params: /users/addresses/:id
// Body: { street, city, state, zipCode }
```

#### `deleteAddress(req, res)`
Remove address.
```javascript
// Params: /users/addresses/:id
// Returns: Success message
```

---

### **productController.js**
Product management logic.

**Functions:**

#### `getAllProducts(req, res)`
Fetch all products with filters.
```javascript
// Query: ?category=dress&priceMax=5000&sort=price
// Returns: { success, data: { products, total, pages } }
// Includes: Pagination, filtering, sorting
```

#### `getProductById(req, res)`
Get single product details.
```javascript
// Params: /products/:id
// Returns: Complete product with reviews & ratings
```

#### `createProduct(req, res)` *(Owner only)*
Add new product.
```javascript
// Body: {
//   title, description, category, size, color,
//   rentPrice, dailyPrice, images, quantity
// }
// Returns: New product ID
// Uploads: Images to Cloudinary
```

#### `updateProduct(req, res)` *(Owner only)*
Update product.
```javascript
// Params: /products/:id
// Body: Partial product fields
// Returns: Updated product
```

#### `deleteProduct(req, res)` *(Owner only)*
Remove product.
```javascript
// Soft delete: Set availability: false
```

#### `getByCategory(req, res)`
Filter by category.
```javascript
// Returns: Array of products in category
// Categories: dress, saree, lehenga, accessories
```

#### `searchProducts(req, res)`
Search products.
```javascript
// Query: ?q=dress&category=women
// Returns: Matching products
```

---

### **cartController.js**
Shopping cart logic.

**Functions:**

#### `getCart(req, res)`
View shopping cart.
```javascript
// Returns: { items: [], totalPrice, itemCount }
```

#### `addToCart(req, res)`
Add item to cart.
```javascript
// Body: {
//   productId, quantity, rentalDates
// }
// Logic: Checks availability, adds to cart
```

#### `updateQuantity(req, res)`
Change item quantity.
```javascript
// Params: /cart/:productId
// Body: { quantity }
```

#### `removeFromCart(req, res)`
Delete item from cart.
```javascript
// Params: /cart/:productId
// Returns: Updated cart
```

#### `clearCart(req, res)`
Empty entire cart.
```javascript
// Returns: { success, message }
```

---

### **orderController.js**
Order processing logic.

**Functions:**

#### `createOrder(req, res)`
Process checkout & create order.
```javascript
// Body: {
//   items: [{productId, quantity, dates}],
//   shippingAddress,
//   paymentMethod
// }
// Logic:
// 1. Verify items availability
// 2. Calculate total
// 3. Process payment (if applicable)
// 4. Create Firestore order
// 5. Clear cart
// 6. Update product inventory
// Returns: { orderId, status: 'confirmed' }
```

#### `getUserOrders(req, res)`
Get user's orders.
```javascript
// Returns: Array of user's orders
```

#### `getOrderById(req, res)`
Single order details.
```javascript
// Returns: Complete order with items, dates, status
```

#### `updateOrderStatus(req, res)` *(Owner/Admin only)*
Change order status.
```javascript
// Body: { status: 'shipped' | 'delivered' | ... }
// Triggers: Notifications to user
```

#### `cancelOrder(req, res)`
Cancel order (if possible).
```javascript
// Checks if before rental start date
// Returns refund amount
```

---

### **wishlistController.js**
Wishlist operations.

**Functions:**

#### `getWishlist(req, res)`
Get user's wishlist.
```javascript
// Returns: Array of product objects
```

#### `addToWishlist(req, res)`
Add product to wishlist.
```javascript
// Body: { productId }
```

#### `removeFromWishlist(req, res)`
Remove from wishlist.
```javascript
// Params: /wishlist/:productId
```

#### `moveToCart(req, res)`
Move wishlist item to cart.
```javascript
// Moves product from wishlist to cart
```

---

### **virtualClosetController.js**
Virtual closet logic.

**Functions:**

#### `createOutfit(req, res)`
Create new outfit.
```javascript
// Body: {
//   items: [productIds],
//   occasion: 'wedding' | 'casual' | ...,
//   name, description
// }
// Returns: New outfit with ID
```

#### `getUserOutfits(req, res)`
Get all user's outfits.
```javascript
// Returns: Array of outfits
```

#### `getOutfitById(req, res)`
Get outfit details.
```javascript
// Returns: Outfit with all items expanded
```

#### `updateOutfit(req, res)`
Modify outfit.
```javascript
// Body: { items, occasion, name }
```

#### `deleteOutfit(req, res)`
Remove outfit.
```javascript
// Params: /virtual-closet/:id
```

---

## 🔐 MIDDLEWARE FOLDER

Request processing and authentication.

### **auth.js**
Firebase token verification.

**Middleware Function:**
```javascript
protect = async (req, res, next) => {
  // 1. Extract token from Authorization header
  // 2. Verify token with Firebase
  // 3. Attach user data to req.firebaseUser
  // 4. Call next() to continue
  // If invalid: Return 401 Unauthorized
}
```

**Usage:**
```javascript
router.use(protect)  // All routes require auth
```

**What Gets Attached:**
```javascript
req.firebaseUser = {
  uid: 'user123',
  email: 'user@example.com',
  name: 'Full Name',
  picture: 'https://...',
  iat: 1234567890
}

// Get Firebase UID
req.firebaseUser.uid
```

---

### **errorHandler.js**
Error handling & logging.

**Functions:**

#### `asyncHandler(fn)`
Wraps controller functions.
```javascript
// Catches errors and passes to error middleware
// Usage: const getMe = asyncHandler(async (req, res) => {...})
```

#### `errorHandler(err, req, res, next)`
Global error handler.
```javascript
// Sends standardized error responses
// Format: { success: false, message, status }
```

#### `notFound(req, res, next)`
404 handler.
```javascript
// Called if route not found
// Returns 404 Not Found
```

**Error Response Format:**
```javascript
{
  success: false,
  message: 'User not found',
  status: 404,
  error: {} // In development only
}
```

---

### **fileUpload.js**
File upload handling (if used).

**Functions:**
```javascript
uploadSingleFile(req, res, next)     // Single file
uploadMultipleFiles(req, res, next)  // Multiple files
```

---

## 🖼️ SERVICES FOLDER

Reusable service functions.

### **cloudinaryService.js**
Cloudinary image operations.

**Functions:**

#### `uploadImage(file, folder)`
Upload image to Cloudinary.
```javascript
// Params:
//   file: Buffer or file path
//   folder: 'products' | 'users' | 'outfits'
// Returns: { public_id, secure_url, width, height }
```

#### `deleteImage(publicId)`
Delete image from Cloudinary.
```javascript
// Removes image by public ID
```

#### `optimizeUrl(publicId, options)`
Generate optimized image URL.
```javascript
// Params:
//   options: { width, height, quality, format }
// Returns: Optimized Cloudinary URL
```

#### `validateCloudinaryConfig()`
Check if credentials exist.
```javascript
// Returns: { isValid: boolean, missing: [] }
```

---

## 📝 COMMON REQUEST/RESPONSE PATTERNS

### **Success Response:**
```javascript
{
  success: true,
  message: 'Operation successful',
  data: {
    user: { id, email, name, ... }
  }
}
```

### **Error Response:**
```javascript
{
  success: false,
  message: 'User not found',
  status: 404
}
```

### **List Response:**
```javascript
{
  success: true,
  data: {
    items: [...],
    total: 50,
    page: 1,
    pages: 5,
    limit: 10
  }
}
```

---

## 🔄 Authentication Flow

```
Frontend sends request
    ↓
Authorization header with Firebase token
    ↓
auth.js (protect middleware)
    ↓
Firebase Admin SDK verifies token
    ↓
req.firebaseUser populated
    ↓
Controller executes
    ↓
Database operations
    ↓
Response sent to frontend
```

---

## 📊 Database Operations Example

```javascript
// Get user
const userRef = db.collection('users').doc(uid)
const userDoc = await userRef.get()
const userData = userDoc.data()

// Create
await db.collection('products').add({
  title: 'Dress',
  price: 500,
  createdAt: new Date()
})

// Update
await db.collection('users').doc(uid).update({
  phone: '9876543210'
})

// Delete
await db.collection('carts').doc(uid).delete()

// Query
const products = await db.collection('products')
  .where('category', '==', 'dress')
  .where('rentPrice', '<', 5000)
  .get()
```

---

## 🚨 Common Errors & Fixes

**Error:** `Firebase Admin SDK not initialized`
**Fix:** Call `initFirebase()` in server.js

**Error:** `Invalid Firebase token`
**Fix:** Frontend sends fresh token, verify FIREBASE_PRIVATE_KEY

**Error:** `CORS error on frontend`
**Fix:** Update FRONTEND_URL in backend .env

**Error:** `Cloudinary upload fails`
**Fix:** Check CLOUDINARY_API_KEY and CLOUD_NAME

---

## 🧪 Testing Endpoints

### Using cURL:
```bash
# Get products
curl http://localhost:5000/api/products

# With auth
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:5000/api/auth/me

# POST request
curl -X POST http://localhost:5000/api/cart/add \
  -H "Content-Type: application/json" \
  -d '{"productId":"123","quantity":2}'
```

---

## 📈 Performance Tips

✅ Use database indexes
✅ Paginate large queries
✅ Cache frequent reads
✅ Batch write operations
✅ Optimize Firestore rules
✅ Monitor request logs

---

**Last Updated:** April 5, 2026
**Reference:** PROJECT_DOCUMENTATION.md
