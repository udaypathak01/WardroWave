# 🎨 FRONTEND STRUCTURE & DOCUMENTATION | WardroWave

## 📋 Frontend Overview

**Technology Stack:**
- React 18 (Vite)
- Tailwind CSS
- Firebase Authentication
- Firestore Database
- Cloudinary for images
- GSAP for animations

**Folder Structure:**
```
src/
├── components/    → Reusable UI components
├── pages/        → Full page components
├── services/     → API & database calls
├── utils/        → Helper functions
├── hooks/        → Custom React hooks
├── config/       → Configuration files
├── context api/  → State management
├── data/         → Static data
├── Routers/      → Route configuration
└── assets/       → Images & media
```

---

## 📂 COMPONENTS FOLDER

All reusable React components organized by feature.

### **common/** - Shared Components
Used across the entire application.

| File | Purpose | Key Functions |
|------|---------|---|
| **Header.jsx** | Navigation bar | `toggleMenu()`, `logout()` |
| **Footer.jsx** | Footer section | Contact links, policies |
| **BottomNav.jsx** | Mobile navigation | Bottom tab bar |
| **ImageGallery.jsx** | Image carousel | `showPrevious()`, `showNext()` |
| **ImageUpload.jsx** | File upload component | `handleFileSelect()`, `uploadImage()` |
| **ProtectedRoute.jsx** | Route guard | Checks authentication |
| **Skeleton.jsx** | Loading placeholder | Skeleton UI |
| **PageTransition.jsx** | Fade animation | `FadeIn` component for animations |

---

### **home/** - Homepage Components
Build the landing page with multiple sections.

| File | Purpose | Key Props |
|------|---------|-----------|
| **HeroSection.jsx** | Hero banner | `title`, `subtitle`, `images` |
| **AiTryOnSection.jsx** | Virtual try-on | `occasions`, `onUpload` |
| **StatsSection.jsx** | Statistics display | `stats` array |
| **StorySection.jsx** | Brand story | Content sections |
| **TeamCards.jsx** | Team members display | `members` array |
| **ValuesCards.jsx** | Core values | `values` array |
| **WhyChooseSection.jsx** | USPs | `benefits` array |
| **FeaturedProducts.jsx** | Product carousel | `products` array |

---

### **products/** - Product Components
Product display and filtering.

| File | Purpose | Functions |
|------|---------|-----------|
| **ProductCard.jsx** | Single product card | `onAddCart()`, `onAddWishlist()` |
| **ProductGrid.jsx** | Product grid layout | `handleFilter()`, `handleSort()` |
| **FilterSidebar.jsx** | Filter panel | `onFilterChange()` |
| **ProductReviews.jsx** | Reviews section | `submitReview()`, `loadMore()` |
| **RatingStars.jsx** | Star rating display | `rating` prop |

---

### **profile/** - User Profile Components

| File | Purpose | Functions |
|------|---------|-----------|
| **ProfileCard.jsx** | User info display | `editProfile()` |
| **AddressBook.jsx** | Manage addresses | `addAddress()`, `deleteAddress()` |
| **OrderHistory.jsx** | Past orders | `filterOrders()`, `viewDetails()` |
| **WishlistView.jsx** | Wishlist display | `removeItem()`, `moveToCart()` |

---

### **dashboard/** - Owner Dashboard

| File | Purpose | Functions |
|------|---------|-----------|
| **DashboardStats.jsx** | Analytics cards | Display revenue, orders, etc |
| **InventoryList.jsx** | Product inventory | `addProduct()`, `editProduct()`, `deleteProduct()` |
| **OrderManagement.jsx** | Order tracking | `updateStatus()`, `viewDetails()` |
| **EarningsChart.jsx** | Revenue graph | Chart visualization |

---

### **rentals/** - Rental Management

| File | Purpose | Functions |
|------|---------|-----------|
| **ActiveRentals.jsx** | Current rentals | `extendRental()`, `returnItem()` |
| **RentalTimeline.jsx** | Rental dates | Calendar view |
| **RentalDetails.jsx** | Single rental info | Full details & actions |

---

### **animations/** - Animation Components

| File | Purpose | Usage |
|------|---------|-------|
| **GSAPReveal.jsx** | Scroll reveal animation | `<GSAPReveal>content</GSAPReveal>` |
| **GSAPTabTransition.jsx** | Tab animation | Tab switching effects |
| **PageTransition.jsx** | Page fade animation | `<FadeIn>content</FadeIn>` |

---

### **about/** - About Page Sections

| File | Purpose | Content |
|------|---------|---------|
| **StorySection.jsx** | Brand story | Company history |
| **StatsSection.jsx** | Key metrics | Users, products, rentals |
| **TeamCards.jsx** | Team members | Team profiles |
| **ValuesCards.jsx** | Core values | Vision & mission |
| **WhyChooseSection.jsx** | Benefits | Why choose WardroWave |

---

### **contact/** - Contact Components

| File | Purpose | Functions |
|------|---------|-----------|
| **ContactForm.jsx** | Contact form | `submitForm()`, `validateEmail()` |
| **MapSection.jsx** | Location map | Embed Google Maps |
| **SocialLinks.jsx** | Social media | Social icons |

---

## 📄 PAGES FOLDER

Full-page components (routes).

### **Authentication Pages**

| File | Purpose | Key Functions |
|------|---------|---|
| **Login.jsx** | Login page | `handleLogin()`, `handleGoogleLogin()` |
| **Signup.jsx** | Registration | `handleSignup()`, `validateForm()` |
| **ForgotPassword.jsx** | Password reset | `sendResetEmail()` |
| **ResetPassword.jsx** | Set new password | `submitNewPassword()` |

---

### **Shopping Pages**

| File | Purpose | Key Functions |
|------|---------|---|
| **Home.jsx** | Homepage | Combines all home components |
| **Products.jsx** | Product listing | `fetchProducts()`, `filterProducts()` |
| **ProductDetails.jsx** | Single product view | `loadProduct()`, `addToCart()` |
| **Cart.jsx** | Shopping cart | `updateQuantity()`, `removeItem()` |
| **Checkout.jsx** | Checkout process | `processPayment()`, `createOrder()` |
| **OrderSuccess.jsx** | Order confirmation | Display order details |

---

### **User Pages**

| File | Purpose | Key Functions |
|------|---------|---|
| **UserProfile.jsx** | User dashboard | `editProfile()`, `changePassword()` |
| **Wishlist.jsx** | Wishlist view | `removeItem()`, `moveToCart()` |
| **Rentals.jsx** | My rentals | `viewRentalDetails()`, `extendRental()` |

---

### **Owner Pages**

| File | Purpose | Key Functions |
|------|---------|---|
| **OwnerDashboard.jsx** | Owner panel | Analytics & management |
| **BecomeOwner.jsx** | Owner signup | `registerAsOwner()`, `submitDocs()` |

---

### **Other Pages**

| File | Purpose | Content |
|------|---------|---------|
| **About.jsx** | About page | Brand story & team |
| **Contact.jsx** | Contact page | Contact form & info |
| **Discover.jsx** | Discovery page | Trending & curated |
| **ImageUploadTest.jsx** | Testing utility | Upload testing |

---

## 🔄 CONTEXT API FOLDER

State management using React Context.

### **AuthContext.jsx**
Manages authentication state globally.

**Functions:**
```javascript
- signup(email, password, name, phone)    // Register user
- login(email, password)                  // Login user
- socialLogin(provider)                   // Google/Facebook login
- logout()                                // Logout
- updateProfile(updates)                  // Update user info
- resetPassword(email)                    // Password reset
```

**State:**
```javascript
{
  user: {id, email, fullName, phone, photoUrl, role},
  isLoading: boolean,
  error: string
}
```

---

### **CartContext.jsx**
Manages shopping cart state.

**Functions:**
```javascript
- addToCart(product, quantity)            // Add item
- removeFromCart(productId)               // Remove item
- updateQuantity(productId, quantity)     // Update qty
- clearCart()                             // Clear all
- getTotalPrice()                         // Calculate total
- getCartItems()                          // Get items
```

**State:**
```javascript
{
  items: [{productId, title, price, quantity, image}],
  totalPrice: number,
  itemCount: number
}
```

---

### **WishlistContext.jsx**
Manages wishlist state.

**Functions:**
```javascript
- addToWishlist(product)                  // Add item
- removeFromWishlist(productId)           // Remove item
- getWishlist()                           // Get all items
- isInWishlist(productId)                 // Check if exists
- clearWishlist()                         // Clear all
```

**State:**
```javascript
{
  items: [{productId, title, price, image}],
  count: number
}
```

---

## 🔧 SERVICES FOLDER

API calls and service functions.

### **firestore.js**
Firestore database queries.

**Functions:**
```javascript
// Products
getProducts()                             // Fetch all products
getProductById(id)                        // Single product
searchProducts(query)                     // Search
getProductsByCategory(category)           // Filter by category

// Users
getUserProfile(uid)                       // Get user data
updateUserProfile(uid, data)              // Update profile

// Orders
getOrders(uid)                           // User orders
getOrderDetails(orderId)                 // Single order

// Inventory
getInventory(ownerId)                    // Owner's products
```

---

### **cloudinary.js**
Image upload to Cloudinary.

**Functions:**
```javascript
uploadImage(file)                         // Upload single image
uploadMultiple(files)                     // Upload multiple
deleteImage(publicId)                     // Delete image
optimizeImage(url, options)               // Image optimization
```

---

### **virtualClosetApi.js**
Virtual closet operations.

**Functions:**
```javascript
createOutfit(uid, items, occasion)        // Create outfit
getOutfits(uid)                          // Get user outfits
deleteOutfit(outfitId)                   // Delete outfit
updateOutfit(outfitId, data)             // Update outfit
```

---

## ⚙️ UTILS FOLDER

Helper functions and utilities.

### **api.js**
API wrapper for backend calls.

**Features:**
- Automatic Firebase token attachment
- Error handling
- Request/response formatting

**Functions:**
```javascript
request(method, endpoint, body)           // Core fetch
get(url)                                 // GET request
post(url, data)                          // POST request
put(url, data)                           // PUT request
delete(url)                              // DELETE request

// Pre-built API objects:
authAPI.syncProfile()
userAPI.getProfile()
productAPI.getAll()
cartAPI.addItem()
// ... etc
```

---

### **gsapAnimations.js**
GSAP animation utilities.

**Functions:**
```javascript
fadeIn(element, duration)                // Fade in animation
slideIn(element, direction)              // Slide animation
scaleUp(element)                         // Scale animation
revealOnScroll(element)                  // Scroll reveal
```

---

## 🎣 HOOKS FOLDER

Custom React hooks.

### **useImageUpload.js**
Image upload hook.

**Usage:**
```jsx
const { image, loading, error, uploadImage } = useImageUpload();

const handleUpload = async (file) => {
  await uploadImage(file);
};
```

**Functions:**
```javascript
uploadImage(file)                         // Upload to Cloudinary
resetState()                             // Clear state
```

---

## ⚙️ CONFIG FOLDER

Configuration files.

### **firebase.js**
Firebase initialization.

```javascript
// Exports:
export const auth          // Firebase Auth instance
export const db            // Firestore database
export const storage       // Cloud Storage
export const analytics     // Google Analytics
```

---

## 🔀 ROUTERS FOLDER

Route configuration.

### **AppRoutes.jsx**
Main route definitions using React Router.

**Key Routes:**
```javascript
/                          → Home
/products                  → Product listing
/products/:id              → Product details
/login                     → Login
/signup                    → Signup
/cart                      → Shopping cart
/checkout                  → Checkout
/user/profile              → User dashboard
/owner/dashboard           → Owner panel
/wishlist                  → Wishlist
/rentals                   → My rentals
/about                     → About page
/contact                   → Contact
```

**Features:**
- Protected routes (require authentication)
- Owner-only routes
- Public routes

---

## 📊 DATA FOLDER

Static data.

### **productsData.js**
Example/seed product data.

---

## 📱 Key Component Props

### **ProductCard**
```jsx
<ProductCard 
  product={{id, title, price, image, rating}}
  onAddCart={() => {}}
  onAddWishlist={() => {}}
/>
```

### **Header**
```jsx
<Header 
  user={user}
  cartCount={5}
  onLogout={() => {}}
/>
```

### **ImageGallery**
```jsx
<ImageGallery 
  images={[]}
  autoPlay={true}
  delay={3000}
/>
```

---

## 🎨 Styling Architecture

**CSS Files:**
- `App.css` → Component styles
- `index.css` → Global base styles
- `responsive.css` → Responsive utilities

**Tailwind Classes:**
```
Colors: slate-50, purple-600, pink-600
Spacing: px-4, py-8, mb-6, gap-3
Sizing: w-full, h-screen, aspect-video
Typography: text-lg, font-bold, uppercase
```

---

## 🔐 Authentication Flow

```
User clicks "Sign Up"
    ↓
SignupForm validates input
    ↓
AuthContext.signup() called
    ↓
Firebase creates user account
    ↓
Backend syncProfile() creates DB record
    ↓
User redirected to home
```

---

## 🛒 Shopping Flow

```
User adds product
    ↓
CartContext.addToCart()
    ↓
Cart state updated
    ↓
User navigates to cart
    ↓
User clicks checkout
    ↓
Checkout page loads
    ↓
User enters payment info
    ↓
Order created in backend
    ↓
Order confirmation page
```

---

## 📱 Responsive Breakpoints

**Tailwind Breakpoints:**
- `sm: 640px`
- `md: 768px` 
- `lg: 1024px`
- `xl: 1280px`

**Usage:**
```jsx
<div className="text-sm md:text-lg lg:text-xl">
  Responsive text
</div>
```

---

## 🚀 Performance Tips

✅ Use React.memo for expensive components
✅ Code splitting with lazy loading
✅ Image optimization with Cloudinary
✅ Debouncing for search/filter
✅ Pagination for large lists
✅ Cache API responses

---

## 📝 File Naming Convention

- **Components:** `PascalCase.jsx` (e.g., `ProductCard.jsx`)
- **Pages:** `PascalCase.jsx` (e.g., `UserProfile.jsx`)
- **Hooks:** `useCustomName.js` (e.g., `useImageUpload.js`)
- **Services:** `camelCase.js` (e.g., `firestore.js`)
- **Utils:** `camelCase.js` (e.g., `gsapAnimations.js`)

---

## 🔗 Folder Dependencies

```
pages/ → components/
pages/ → services/
pages/ → context api/
components/ → utils/
services/ → config/
utils/ → config/
```

---

## ✅ Checklist for Adding New Component

- [ ] Create component in appropriate folder
- [ ] Add PropTypes or TypeScript types
- [ ] Write JSDoc comments
- [ ] Add Tailwind classes
- [ ] Test responsive design
- [ ] Update imports in parent
- [ ] Document in this file

---

**Last Updated:** April 5, 2026
**Reference:** PROJECT_DOCUMENTATION.md
