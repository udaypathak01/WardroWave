# 🌊 WardroWave - Complete Project Documentation

**Latest Update:** April 12, 2026  
**Project Status:** ✅ Active Development  
**Version:** 2.0.0

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Brand Theme & Design](#brand-theme--design)
3. [Technology Stack](#technology-stack)
3. [Current Features](#current-features)
4. [Project Architecture](#project-architecture)
5. [Authentication System](#authentication-system)
6. [Database Schema](#database-schema)
7. [API Routes](#api-routes)
8. [Project Structure](#project-structure)
9. [Work Completed](#work-completed)
10. [Backend Services](#backend-services)
11. [Frontend Components](#frontend-components)
12. [Recent Fixes & Improvements](#recent-fixes--improvements)
13. [Environment Setup](#environment-setup)
14. [Deployment](#deployment)
15. [Future Roadmap](#future-roadmap)

---

## 🎯 Project Overview

**WardroWave** is a modern **Fashion Rental & Wardrobe Management Platform** built with cutting-edge web technologies. It allows users to:

- **Rent designer clothing** from verified owners at affordable prices
- **Earn passive income** by listing unused pieces in their wardrobe
- **Manage their virtual closet** with AI-powered styling recommendations
- **Build custom outfits** with an intelligent AI Stylist
- **Track rentals & orders** with real-time updates
- **Secure transactions** using Firebase Authentication

### 🎨 Core Value Proposition

1. **Sustainability** - Extends clothing lifecycle, reduces fashion waste
2. **Affordability** - Access premium fashion without the premium price tag
3. **Convenience** - Hassle-free logistics handled by the platform
4. **Community** - Connect with fashion enthusiasts, share styles
5. **AI-Powered** - Personalized recommendations based on preferences

---

## 🎨 Brand Theme & Design

### Brand Identity

**Brand Name:** WardroWave  
**Tagline:** "Rent Luxury, Create Style, Earn Income"  
**Mission:** Making premium fashion accessible, sustainable, and profitable for everyone

### Visual Identity

#### Color Palette

| Color | Hex Code | Usage | Psychology |
|-------|----------|-------|------------|
| **Primary Purple** | `#7C3AED` | Buttons, Links, Highlights | Creativity, Luxury, Sophistication |
| **Dark Purple** | `#6D28D9` | Hover states, Deep backgrounds | Power, Trust |
| **Light Purple** | `#EDE9FE` | Backgrounds, Light elements | Soft, Approachable |
| **Gradient** | `#7C3AED → #EC4899` | Hero sections, Accents | Dynamic, Modern |
| **Pink Accent** | `#EC4899` | Secondary accents, CTAs | Femininity, Energy |
| **Dark Gray** | `#111827` | Text, Dark backgrounds | Professionalism |
| **Light Gray** | `#F3F4F6` | Card backgrounds, Borders | Clean, Minimal |
| **White** | `#FFFFFF` | Primary background | Clarity |
| **Error Red** | `#EF4444` | Error messages, Alerts | Urgency |
| **Success Green** | `#10B981` | Success messages, Confirmations | Positive |

#### Color Swatches
```
Primary Brand Colors:
████ #7C3AED (Primary Purple)
████ #EC4899 (Pink Accent)
████ #6D28D9 (Dark Purple)

Neutral Colors:
████ #111827 (Dark Gray)
████ #F9FAFB (Light Gray)
████ #FFFFFF (White)

Functional Colors:
████ #EF4444 (Error)
████ #10B981 (Success)
████ #3B82F6 (Info)
████ #F59E0B (Warning)
```

### Typography

#### Font Family
- **Primary Font:** `sans-serif` (Fallback to system fonts)
- **Component Usage:**
  - Headings: Bold, uppercase tracking
  - Body text: Regular weight, 16px base
  - Small text: 14px, medium weight

#### Font Sizes
```
h1: 2.5rem (40px) - Bold, Main titles
h2: 2rem (32px) - Section titles
h3: 1.5rem (24px) - Subsection titles
h4: 1.25rem (20px) - Card titles
p: 1rem (16px) - Body text
small: 0.875rem (14px) - Secondary text
```

#### Font Weights
```
Regular: 400 - Body text
Medium: 500 - Labels, small headings
Semi-bold: 600 - Buttons, emphasis
Bold: 700 - Headlines, strong emphasis
Extra-bold: 800 - Large titles
```

### Design System

#### Buttons

**Primary Button (CTA)**
```css
Background: Linear gradient(#7C3AED → #EC4899)
Text: White
Padding: 12px 32px
Border-radius: 8px
Font-weight: 600
Hover: Darker gradient, shadow
Active: Scale down 0.98
Transition: All 300ms ease
```

**Secondary Button**
```css
Background: #F3F4F6
Text: #111827
Padding: 12px 32px
Border: 2px solid #E5E7EB
Border-radius: 8px
Hover: Background #E5E7EB
```

**Ghost Button**
```css
Background: transparent
Text: #7C3AED
Border: 2px solid #7C3AED
Hover: Background #EDE9FE
```

#### Cards
```css
Background: White
Border-radius: 12px
Box-shadow: 0 4px 6px rgba(0,0,0,0.1)
Hover: Shadow 0 10px 25px rgba(0,0,0,0.15)
Transition: All 300ms ease
Padding: 24px
```

#### Input Fields
```css
Border: 2px solid #E5E7EB
Border-radius: 8px
Padding: 12px 16px
Focus: Border #7C3AED, Shadow 0 0 0 3px rgba(124,58,237,0.1)
Placeholder: #9CA3AF
Transition: All 200ms ease
```

#### Badges
```css
Primary: Background #EDE9FE, Text #7C3AED
Success: Background #ECFDF5, Text #10B981
Error: Background #FEF2F2, Text #EF4444
Warning: Background #FEF3C7, Text #F59E0B
```

### Layout & Spacing

#### Spacing Scale
```
xs: 4px (0.25rem)
sm: 8px (0.5rem)
md: 16px (1rem)
lg: 24px (1.5rem)
xl: 32px (2rem)
2xl: 48px (3rem)
3xl: 64px (4rem)
```

#### Grid System
- **12-column grid**
- Max width: 1280px
- Gutters: 24px
- Mobile: Single column
- Tablet: 2-4 columns
- Desktop: Full grid

#### Border Radius
```
Small: 4px
Default: 8px
Large: 12px
Full: 9999px (Circles, pills)
```

### Visual Elements

#### Icons
- **Library:** Feather icons or custom SVGs
- **Style:** Minimal, clean, 24px base size
- **Colors:** Inherit text color or use brand colors

#### Shadows
```
Small: 0 1px 2px 0 rgba(0, 0, 0, 0.05)
Medium: 0 4px 6px -1px rgba(0, 0, 0, 0.1)
Large: 0 10px 15px -3px rgba(0, 0, 0, 0.1)
Extra: 0 20px 25px -5px rgba(0, 0, 0, 0.1)
```

#### Transitions
```
Fast: 200ms cubic-bezier(0.4, 0, 0.2, 1)
Default: 300ms cubic-bezier(0.4, 0, 0.2, 1)
Slow: 500ms cubic-bezier(0.4, 0, 0.2, 1)
```

### Page Structure

#### Homepage Layout
```
┌─────────────────────────────────┐
│         Header/Nav              │
├─────────────────────────────────┤
│  Hero Section (Full width)      │
│  - Gradient background          │
│  - CTA button                   │
├─────────────────────────────────┤
│  Features Section               │
│  - 3-4 feature cards in grid    │
├─────────────────────────────────┤
│  AI Stylist Section             │
│  - Image + description          │
├─────────────────────────────────┤
│  How It Works Section           │
│  - Step-by-step timeline        │
├─────────────────────────────────┤
│  Testimonials Section           │
│  - Swiper carousel of quotes    │
├─────────────────────────────────┤
│  CTA Section                    │
│  - Gradient background          │
│  - Call to action               │
├─────────────────────────────────┤
│  Footer                         │
└─────────────────────────────────┘
```

#### Product Card
```
┌──────────────────┐
│  Product Image   │ (with hover zoom)
│  (Responsive)    │
├──────────────────┤
│  Brand Name      │ (Small gray)
│  Product Title   │ (Dark, Bold)
│  ★★★★★ (4.5)     │ (Rating)
│  ₹500/day        │ (Price)
├──────────────────┤
│ [Add to Cart]    │ (Primary button)
│ [Add to Wishlist]│ (Ghost button)
└──────────────────┘
```

#### User Profile Card
```
┌──────────────────────┐
│   Avatar (40px)      │
│ Name                 │ (Bold)
│ role@gmail.com       │ (Gray)
│ ★ 4.8 • 42 reviews   │
├──────────────────────┤
│ City, Country        │
│ Member since Jan25   │
├──────────────────────┤
│ [Edit] [Message]     │
└──────────────────────┘
```

### Animation & Interactions

#### Page Transitions
- **Fade in:** 300ms on page load
- **Slide up:** 400ms for content reveal
- **Scale:** 200ms for card hover
- Tool used: GSAP

#### Micro-interactions
```
Button hover: 
  - Scale: 1.02x
  - Shadow increase
  - Duration: 200ms

Card hover:
  - Scale: 1.01x
  - Shadow increase
  - Duration: 300ms

Input focus:
  - Border color change
  - Shadow glow
  - Duration: 200ms

Scroll animations:
  - Elements fade/slide in
  - On viewport entry
  - Staggered delays
```

### Responsive Design Breakpoints

```
Mobile:    0px - 640px  (xs, sm)
Tablet:    641px - 1024px (md, lg)
Desktop:   1025px+     (xl, 2xl)

Mobile-first approach:
- Design for mobile first
- Add media queries for larger screens
- Progressive enhancement
```

#### Mobile Optimization
- Stack layout vertically
- Larger touch targets (48px minimum)
- Bottom navigation for primary actions
- Modal-based navigation
- Simplified forms

#### Tablet Layout
- 2-column grid for products
- Side-by-side sections
- Reduced padding/margins
- Optimized navigation

#### Desktop Layout
- Full 3-4 column grids
- Side panels
- Horizontal navigation
- Maximum width containers

### Branding Guidelines

#### Logo
- Logo: WardroWave (text-based)
- Tagline: "Rent Luxury, Create Style, Earn Income"
- Never distort or rotate logo
- Minimum size: 40px width
- Clear space: Equal to "W" width on all sides

#### Usage
```
✅ CORRECT:
- Logo on white background
- Logo with tagline below
- Logo with proper spacing

❌ INCORRECT:
- Rotated logo
- Logo on busy background
- Logo too small
- Logo stretched
```

#### Copy Tone
- **Tone:** Friendly, aspirational, inclusive
- **Voice:** Modern, energetic, empowering
- **Language:** Simple, conversational
- **Avoid:** Corporate jargon, negativity

#### Example Copy
```
✅ Good:
"Rent designer fashion for less.
 Earn passive income from your wardrobe.
 Join the WardroWave community today!"

❌ Bad:
"Fashion rental e-commerce platform
 with peer-to-peer transaction capability."
```

### Accessibility

#### Color Contrast
- Text on background: Minimum 4.5:1 ratio
- Large text: Minimum 3:1 ratio
- Interactive elements: Clearly visible

#### Typography
- Font size minimum: 14px for body
- Line height: 1.5-1.6 for readability
- Maximum line length: 70 characters

#### Interactive Elements
- Minimum touch target: 48x48px
- Clear focus states
- Keyboard navigation support
- ARIA labels on icons

### Dark Mode (Future)
```
Background: #0F172A (Dark slate)
Text: #F1F5F9 (Light slate)
Cards: #1E293B (Slightly lighter)
Accents: Purple & Pink (unchanged)
```

### Design Tools & Resources

| Tool | Purpose |
|------|---------|
| **Figma** | UI Design & Prototyping |
| **TailwindCSS** | Responsive utility CSS |
| **GSAP** | Advanced animations |
| **Cloudinary** | Image optimization |
| **Vercel** | Deployment & previews |

---

## 🛠️ Technology Stack

### 🖥️ Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 18.3+ | UI Framework |
| **Vite** | 5.0+ | Build tool & dev server |
| **TailwindCSS** | 3.4+ | Styling & responsive design |
| **React Router** | 6.x | Client-side routing |
| **Firebase SDK** | 10.0+ | Authentication & Realtime DB |
| **GSAP** | 3.12+ | Advanced animations |
| **Axios** | Latest | HTTP requests (custom implementation) |
| **Cloudinary** | React SDK | Image upload & optimization |

### 🔌 Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Node.js** | 18+/20+ | Runtime environment |
| **Express.js** | 4.19+ | Web framework |
| **Firebase Admin SDK** | 13.0+ | Admin authentication & Firestore |
| **Firestore** | Latest | NoSQL database |
| **Cloudinary SDK** | 1.40+ | Image storage & CDN |
| **Multer** | 1.4.5+ | File upload handling |
| **Nodemon** | 3.0+ | Development auto-reload |
| **CORS** | Latest | Cross-origin requests |
| **Helmet** | Latest | Security headers |
| **Express Rate Limit** | Latest | API rate limiting |
| **Morgan** | Latest | HTTP logging |
| **Cookie Parser** | Latest | Cookie handling |

### 🗄️ Database & Services
| Service | Purpose |
|---------|---------|
| **Firebase Firestore** | Primary NoSQL database |
| **Firebase Authentication** | User identity & security |
| **Firebase Storage** | Document/rule storage |
| **Cloudinary** | Image CDN & optimization |
| **Firebase Security Rules** | Database access control |

### 🚀 Deployment
| Platform | Purpose |
|----------|---------|
| **Vercel** | Frontend hosting & deployment |
| **Vercel (Backend)** | Backend serverless deployment |
| **Firebase** | Real-time database & auth |
| **Cloudinary** | Image optimization & CDN |

---

## ✨ Current Features

### 👥 User Authentication
- ✅ Email/Password registration & login
- ✅ Google OAuth integration
- ✅ Facebook OAuth integration
- ✅ Password reset functionality
- ✅ Account deactivation
- ✅ User profile management
- ✅ Automatic profile sync (Firebase → Firestore)

### 👗 Product Management
- ✅ Browse all available items
- ✅ Category filtering (Men, Women, Accessories)
- ✅ Product search & sorting
- ✅ Image gallery for each product
- ✅ Detailed product descriptions
- ✅ Real-time stock availability
- ✅ Price display with rental terms

### 🛒 Shopping Cart
- ✅ Add/remove items from cart
- ✅ Real-time cart updates
- ✅ Cart persistence
- ✅ Quantity management
- ✅ Cart subtotal calculation

### ❤️ Wishlist
- ✅ Add items to wishlist
- ✅ Remove from wishlist
- ✅ Wishlist persistence
- ✅ Quick add to cart from wishlist

### 📦 Rental Management
- ✅ Checkout process
- ✅ Rental period selection
- ✅ Address management
- ✅ Order confirmation
- ✅ Order tracking
- ✅ Rental history
- ✅ Payment gateway ready

### 👔 Become an Owner
- ✅ Owner registration flow
- ✅ Product listing dashboard
- ✅ Inventory management
- ✅ Upload product images
- ✅ Price setting
- ✅ Earnings tracking
- ✅ Owner analytics

### 🤖 Virtual Closet
- ✅ Upload personal images
- ✅ Create outfit looks
- ✅ Manage wardrobe
- ✅ Delete looks
- ✅ Image optimization via Cloudinary
- ✅ Real-time sync with Firestore

### 🤳 User Profile
- ✅ View profile info
- ✅ Edit personal details
- ✅ Manage addresses
- ✅ Add/update/delete addresses
- ✅ View rental history
- ✅ Track orders
- ✅ Gender selection for recommendations

### 🎨 UI/UX Features
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Dark mode considerations
- ✅ Smooth animations (GSAP)
- ✅ Loading states
- ✅ Error handling & user feedback
- ✅ Toast notifications
- ✅ Modal dialogs

---

## 🏗️ Project Architecture

### System Architecture Diagram
```
┌─────────────────────────────────────────────────────────────────┐
│                     User Browser (Frontend)                      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  React Application (Port 5173)                            │  │
│  │  ├── Pages (Home, Products, Cart, etc.)                  │  │
│  │  ├── Components (Header, Footer, Cards, Forms)           │  │
│  │  ├── Context API (Auth, Cart, Wishlist)                  │  │
│  │  └── Services (Firebase, Cloudinary, API)                │  │
│  └────────────────────┬─────────────────────────────────────┘  │
└─────────────────────┼──────────────────────────────────────────┘
                      │ HTTP/REST
                      ├─────────────────────────────────────────┐
                      │                                         │
                      ↓                                         ↓
        ┌──────────────────────────┐              ┌─────────────────────┐
        │   Nginx/Vercel Proxy     │              │   Firebase Console  │
        │   (API Gateway)          │              │                     │
        │   (Port 5000)            │              │   ├── Auth          │
        └────────────┬─────────────┘              │   ├── Firestore     │
                     │                             │   ├── Storage       │
                     ↓                             │   └── Rules         │
        ┌──────────────────────────┐              │                     │
        │  Express.js Backend      │              └─────────────────────┘
        │  (Port 5000)             │
        │ ┌──────────────────────┐ │              ┌─────────────────────┐
        │ │ Routes Layer         │ │              │   Cloudinary CDN    │
        │ │ ├── /api/auth        │ │              │                     │
        │ │ ├── /api/users       │ │              │   - Image Upload    │
        │ │ ├── /api/products    │ │              │   - Image Transform │
        │ │ ├── /api/cart        │ │              │   - Image Delivery  │
        │ │ ├── /api/wishlist    │ │              │                     │
        │ │ ├── /api/orders      │ │              └─────────────────────┘
        │ │ └── /api/vc (closet) │ │
        │ └──────────┬───────────┘ │
        │            │             │
        │ ┌──────────↓───────────┐ │
        │ │ Middleware           │ │
        │ │ ├── Authentication   │ │
        │ │ ├── CORS             │ │
        │ │ ├── Rate Limiting    │ │
        │ │ ├── Error Handling   │ │
        │ │ └── Logging          │ │
        │ └──────────┬───────────┘ │
        │            │             │
        │ ┌──────────↓───────────┐ │
        │ │ Controllers          │ │
        │ │ ├── Auth             │ │
        │ │ ├── User             │ │
        │ │ ├── Product          │ │
        │ │ ├── Cart             │ │
        │ │ ├── Order            │ │
        │ │ ├── Wishlist         │ │
        │ │ └── VirtualCloset    │ │
        │ └──────────┬───────────┘ │
        │            │             │
        │ ┌──────────↓───────────┐ │
        │ │ Services             │ │
        │ │ └── Cloudinary API   │ │
        │ └──────────┬───────────┘ │
        │            │             │
        │ ┌──────────↓───────────┐ │
        │ │ Firebase Client      │ │
        │ │ └── Admin SDK        │ │
        │ └──────────┬───────────┘ │
        └────────────┼─────────────┘
                     │
                     ↓
        ┌──────────────────────────┐
        │  Firebase Admin SDK      │
        │  ├── Verify ID Tokens    │
        │  ├── Create Users        │
        │  ├── Delete Users        │
        │  └── Revoke Tokens       │
        └────────────┬─────────────┘
                     │
                     ↓
        ┌──────────────────────────┐
        │   Google Cloud          │
        │   ├── Firestore DB      │
        │   ├── Authentication    │
        │   ├── Storage           │
        │   └── Cloud Functions   │
        └──────────────────────────┘
```

### Data Flow
```
User Action → React Component → Context API → API Service → 
  Backend Route → Middleware → Controller → Firestore/External Service → 
  Response → State Update → Re-render UI
```

---

## 🔐 Authentication System

### How It Works

#### **Signup Flow**
1. User fills signup form (email, password, name, phone)
2. Firebase creates user account
3. Client gets ID token from Firebase
4. Client calls `/api/auth/sync-profile` with token
5. Backend verifies token using Firebase Admin SDK
6. Backend creates Firestore user document
7. Backend automatically creates Cart & Wishlist
8. Frontend updates auth state
9. User redirected to dashboard

#### **Login Flow**
1. User enters credentials
2. Firebase authenticates user
3. `onAuthStateChanged` fires automatically
4. Frontend calls `/api/auth/me` for user profile
5. Backend verifies token and loads Firestore profile
6. Frontend sets auth context
7. User authenticated & logged in

#### **Social Login (Google/Facebook)**
1. User clicks "Sign in with Google/Facebook"
2. Firebase popup opens
3. User grants permissions
4. Firebase returns authenticated user
5. Client calls `/api/auth/sync-profile`
6. Backend creates profile if first-time login
7. User logged in with social account

### Token Verification
```
┌────────────────┐
│  Frontend      │
│  auth.current  │
│  User          │
└────────┬───────┘
         │
         │ getIdToken(true)
         ↓
┌────────────────────────────┐
│  Firebase SDK             │
│  - Refreshes token       │
│  - Encrypts with private key │
│  - Returns JWT           │
└────────┬───────────────────┘
         │
         │ Authorization: Bearer <token>
         ↓
┌────────────────────────────┐
│  Express Server           │
│  - Extracts token         │
│  - Calls verifyIdToken()  │
└────────┬───────────────────┘
         │
         │ Firebase Admin SDK
         ↓
┌────────────────────────────┐
│  Google Cloud             │
│  - Verifies signature      │
│  - Checks expiration       │
│  - Returns claims          │
└────────┬───────────────────┘
         │
         │ User object with claims
         ↓
┌────────────────────────────┐
│  Backend                  │
│  - Loads Firestore profile │
│  - Checks if user exists   │
│  - Creates if first login  │
└────────────────────────────┘
```

---

## 📊 Database Schema

### Firestore Collections

#### **`users` Collection**
```javascript
{
  uid: "firebase-uid",
  email: "user@wardrowave.com",
  fullName: "John Doe",
  phone: "+91-XXXXXXXXXX",
  photoUrl: "https://...",
  gender: "male" | "female" | "other" | null,
  role: "user" | "owner" | "admin",
  isActive: true,
  authProvider: "password" | "google.com" | "facebook.com",
  addresses: [
    {
      id: "addr-1",
      type: "home" | "work" | "other",
      street: "123 Main St",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      country: "USA",
      isDefault: true,
      createdAt: "2024-01-01T..."
    }
  ],
  createdAt: "2024-01-01T...",
  updatedAt: "2024-01-01T...",
  deletedAt: null,
  stats: {
    totalRentals: 5,
    totalSpent: 5000,
    averageRating: 4.5
  }
}
```

#### **`products` Collection**
```javascript
{
  id: "prod-123",
  name: "Designer Saree",
  description: "Beautiful silk saree perfect for weddings",
  category: "women",
  subcategory: "ethnic-wear",
  brand: "Dior",
  images: [
    {
      id: "img-1",
      url: "https://cloudinary.com/...",
      publicId: "wardrowave/products/...",
      uploadedAt: "2024-01-01T..."
    }
  ],
  price: {
    rentalPerDay: 500,
    depositRequired: 10000,
    currency: "INR"
  },
  sizes: ["XS", "S", "M", "L", "XL"],
  color: "Red",
  material: "Silk",
  condition: "like-new",
  owner: "owner-uid",
  ownerName: "Priya Sharma",
  availability: {
    isAvailable: true,
    stock: 1,
    bookedDates: ["2024-01-05", "2024-01-06"]
  },
  ratings: {
    averageRating: 4.8,
    totalReviews: 42,
    reviews: [{
      userId: "user-id",
      rating: 5,
      comment: "Perfect fit!",
      createdAt: "2024-01-01T..."
    }]
  },
  seo: {
    tags: ["saree", "ethnic", "wedding"],
    slug: "designer-saree"
  },
  createdAt: "2024-01-01T...",
  updatedAt: "2024-01-01T...",
  deletedAt: null
}
```

#### **`carts` Collection**
```javascript
{
  uid: "user-uid",
  items: [
    {
      productId: "prod-123",
      quantity: 2,
      rentalDays: 5,
      pricePerDay: 500,
      totalPrice: 5000,
      addedAt: "2024-01-01T..."
    }
  ],
  subtotal: 5000,
  tax: 500,
  total: 5500,
  updatedAt: "2024-01-01T...",
  expiresAt: "2024-01-15T..." // Auto-delete old carts
}
```

#### **`wishlists` Collection**
```javascript
{
  uid: "user-uid",
  productIds: ["prod-123", "prod-456"],
  items: [
    {
      productId: "prod-123",
      name: "Designer Saree",
      price: 500,
      image: "https://...",
      addedAt: "2024-01-01T..."
    }
  ],
  updatedAt: "2024-01-01T..."
}
```

#### **`orders` Collection**
```javascript
{
  id: "order-123",
  userId: "user-uid",
  items: [
    {
      productId: "prod-123",
      name: "Designer Saree",
      rentalPeriod: {
        startDate: "2024-01-10",
        endDate: "2024-01-15",
        days: 5
      },
      price: 2500,
      image: "https://..."
    }
  ],
  pricing: {
    subtotal: 2500,
    tax: 250,
    shippingFee: 100,
    depositRequired: 10000,
    total: 2850
  },
  deliveryAddress: {
    name: "John Doe",
    street: "123 Main St",
    city: "New York",
    state: "NY",
    zipCode: "10001"
  },
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled",
  paymentStatus: "pending" | "completed" | "failed" | "refunded",
  ownerId: "owner-uid",
  owner: { /* owner details */ },
  tracking: {
    shippingProvider: "FedEx",
    trackingNumber: "123456789",
    estimatedDelivery: "2024-01-10"
  },
  notes: "Handle with care",
  createdAt: "2024-01-01T...",
  updatedAt: "2024-01-01T...",
  deliveredAt: null,
  returnedAt: null,
  cancelledAt: null
}
```

#### **`virtual_closet` Subcollection** (under users)
```javascript
// Path: users/{uid}/virtual_closet/{lookId}
{
  id: "look-123",
  name: "Wedding Outfit",
  description: "Beautiful ethnic mix",
  images: [
    {
      url: "https://cloudinary.com/...",
      publicId: "wardrowave/virtual-closet/...",
      uploadedAt: "2024-01-01T..."
    }
  ],
  tags: ["wedding", "ethnic", "summer"],
  occasion: "wedding",
  season: "summer",
  colors: ["red", "gold"],
  createdAt: "2024-01-01T...",
  updatedAt: "2024-01-01T...",
  isPublic: false,
  likes: 0,
  comments: []
}
```

#### **`notifications` Collection** (Optional)
```javascript
{
  userId: "user-uid",
  type: "order" | "message" | "rental" | "payment",
  title: "Order Confirmed",
  message: "Your order #123 has been confirmed",
  data: { orderId: "order-123" },
  read: false,
  createdAt: "2024-01-01T...",
  expiresAt: "2024-02-01T..."
}
```

---

## 🔌 API Routes

### Base URL
- **Development:** `http://localhost:5000/api`
- **Production:** `https://wardrowave-backend.vercel.app/api`

### Authentication Routes

#### `POST /api/auth/sync-profile`
Sync user profile from Firebase to Firestore
```
Request:
{
  "fullName": "John Doe",
  "phone": "+91-XXXXXXXXXX",
  "photoUrl": "https://..."
}

Response:
{
  "success": true,
  "message": "Profile synced",
  "data": {
    "user": { /* user object */ }
  }
}
```

#### `GET /api/auth/me`
Get current user profile
```
Headers: Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "user": { /* user object */ }
  }
}
```

#### `POST /api/auth/logout`
Logout user and revoke refresh token
```
Headers: Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### `DELETE /api/auth/delete-account`
Soft delete user account
```
Headers: Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Account deleted successfully"
}
```

### User Routes

#### `GET /api/users/profile`
Get user profile
```
Headers: Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": { /* user object */ }
}
```

#### `PUT /api/users/profile`
Update user profile
```
Headers: Authorization: Bearer <token>

Request:
{
  "fullName": "Jane Doe",
  "phone": "+91-YYYYYYYYYY",
  "gender": "female",
  "photoUrl": "https://..."
}

Response:
{
  "success": true,
  "data": { /* updated user */ }
}
```

#### `GET /api/users/addresses`
Get user addresses
```
Headers: Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "addresses": [ /* array of addresses */ ]
  }
}
```

#### `POST /api/users/addresses`
Add new address
```
Headers: Authorization: Bearer <token>

Request:
{
  "type": "home",
  "street": "123 Main St",
  "city": "New York",
  "state": "NY",
  "zipCode": "10001",
  "isDefault": true
}

Response:
{
  "success": true,
  "data": { /* new address */ }
}
```

#### `PUT /api/users/addresses/:id`
Update address
```
Headers: Authorization: Bearer <token>

Request: { /* address fields */ }

Response:
{
  "success": true,
  "data": { /* updated address */ }
}
```

#### `DELETE /api/users/addresses/:id`
Delete address
```
Headers: Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Address deleted"
}
```

### Product Routes

#### `GET /api/products`
Get all products with pagination
```
Query Params:
- page: 1
- limit: 20
- category: women|men|accessories
- search: "saree"
- sort: "price-asc" | "price-desc" | "newest" | "rating"

Response:
{
  "success": true,
  "data": {
    "products": [ /* array */ ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

#### `GET /api/products/featured`
Get featured products
```
Response:
{
  "success": true,
  "data": {
    "products": [ /* featured items */ ]
  }
}
```

#### `GET /api/products/categories`
Get product categories
```
Response:
{
  "success": true,
  "data": {
    "categories": [
      { "name": "Women", "count": 50 },
      { "name": "Men", "count": 30 },
      { "name": "Accessories", "count": 20 }
    ]
  }
}
```

#### `GET /api/products/:id`
Get product details
```
Response:
{
  "success": true,
  "data": { /* full product object */ }
}
```

#### `GET /api/products/owner/my-products`
Get owner's products
```
Headers: Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "products": [ /* owner's products */ ]
  }
}
```

### Cart Routes

#### `GET /api/cart`
Get cart
```
Headers: Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": { /* cart object */ }
}
```

#### `POST /api/cart/add`
Add item to cart
```
Headers: Authorization: Bearer <token>

Request:
{
  "productId": "prod-123",
  "quantity": 1,
  "rentalDays": 5
}

Response:
{
  "success": true,
  "data": { /* updated cart */ }
}
```

#### `POST /api/cart/remove`
Remove item from cart
```
Headers: Authorization: Bearer <token>

Request:
{
  "productId": "prod-123"
}

Response:
{
  "success": true,
  "data": { /* updated cart */ }
}
```

#### `DELETE /api/cart/clear`
Clear cart
```
Headers: Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Cart cleared"
}
```

### Wishlist Routes

#### `GET /api/wishlist`
Get wishlist
```
Headers: Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": { /* wishlist object */ }
}
```

#### `POST /api/wishlist/toggle`
Add/remove item from wishlist
```
Headers: Authorization: Bearer <token>

Request:
{
  "productId": "prod-123"
}

Response:
{
  "success": true,
  "data": { /* updated wishlist */ }
}
```

### Order Routes

#### `POST /api/orders`
Create order
```
Headers: Authorization: Bearer <token>

Request:
{
  "items": [
    {
      "productId": "prod-123",
      "rentalDays": 5
    }
  ],
  "addressId": "addr-1",
  "paymentMethod": "card"
}

Response:
{
  "success": true,
  "data": { /* created order */ }
}
```

#### `GET /api/orders`
Get user orders
```
Headers: Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "orders": [ /* user's orders */ ]
  }
}
```

#### `GET /api/orders/:id`
Get order details
```
Headers: Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": { /* order object */ }
}
```

#### `POST /api/orders/:id/cancel`
Cancel order
```
Headers: Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Order cancelled"
}
```

### Virtual Closet Routes

#### `POST /api/virtual-closet/upload`
Upload outfit/look
```
Headers: 
  Authorization: Bearer <token>
  Content-Type: multipart/form-data

Form Data:
- files: [image1, image2, ...]
- name: "Wedding Outfit"
- occasion: "wedding"

Response:
{
  "success": true,
  "data": { /* created look */ }
}
```

#### `GET /api/virtual-closet`
Get user's closet
```
Headers: Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "looks": [ /* all looks */ ]
  }
}
```

#### `GET /api/virtual-closet/:lookId`
Get specific look
```
Headers: Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": { /* look object */ }
}
```

#### `DELETE /api/virtual-closet/:lookId`
Delete look
```
Headers: Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Look deleted"
}
```

---

## 📁 Project Structure

```
wardrowave/
├── 📄 package.json                 # Frontend dependencies
├── 📄 vite.config.mjs             # Vite config (proxy to backend)
├── 📄 index.html                  # Main HTML file
├── 📄 tailwind.config.js          # Tailwind CSS config
├── 📄 eslint.config.js            # ESLint rules
├── 📄 firestore.rules             # Firestore security rules
├── 📄 firebase.json               # Firebase deployment config
├── 📄 vercel.json                 # Vercel deployment config
├── 📄 .firebaserc                 # Firebase CLI config
├── 📄 .env.production             # Production environment variables
│
├── 📁 public/                     # Static assets
│
├── 📁 src/                        # Frontend source code
│   ├── 📄 main.jsx               # React entry point
│   ├── 📄 index.css              # Global styles
│   ├── 📄 App.jsx                # Root component
│   ├── 📄 App.css                # App styles
│   ├── 📄 responsive.css         # Responsive utilities
│   │
│   ├── 📁 config/                # Configuration
│   │   └── 📄 firebase.js        # Firebase initialization
│   │
│   ├── 📁 context api/           # Global state management
│   │   ├── 📄 AuthContext.jsx    # Authentication state
│   │   ├── 📄 CartContext.jsx    # Shopping cart state
│   │   └── 📄 WishlistContext.jsx # Wishlist state
│   │
│   ├── 📁 services/              # API integrations
│   │   ├── 📄 cloudinary.js      # Cloudinary image upload
│   │   ├── 📄 firestore.js       # Firestore queries
│   │   └── 📄 virtualClosetApi.js # Virtual closet API
│   │
│   ├── 📁 utils/                 # Utility functions
│   │   ├── 📄 api.js             # API request handler
│   │   └── 📄 gsapAnimations.js  # Animation utilities
│   │
│   ├── 📁 hooks/                 # Custom React hooks
│   │   └── 📄 useImageUpload.js  # Image upload hook
│   │
│   ├── 📁 data/                  # Static data
│   │   └── 📄 productsData.js    # Sample products
│   │
│   ├── 📁 Routers/               # Route definitions
│   │   └── 📄 AppRoutes.jsx      # All routes
│   │
│   ├── 📁 pages/                 # Page components
│   │   ├── 📄 Home.jsx           # Homepage
│   │   ├── 📄 Login.jsx          # Login page
│   │   ├── 📄 Signup.jsx         # Signup page
│   │   ├── 📄 About.jsx          # About page
│   │   ├── 📄 Contact.jsx        # Contact page
│   │   ├── 📄 Products.jsx       # All products
│   │   ├── 📄 ProductDetails.jsx # Single product
│   │   ├── 📄 Cart.jsx           # Shopping cart
│   │   ├── 📄 Checkout.jsx       # Checkout
│   │   ├── 📄 OrderSuccess.jsx   # Order confirmation
│   │   ├── 📄 Rentals.jsx        # My rentals
│   │   ├── 📄 Wishlist.jsx       # Wishlist
│   │   ├── 📄 UserProfile.jsx    # User profile
│   │   ├── 📄 OwnerDashboard.jsx # Owner dashboard
│   │   ├── 📄 BecomeOwner.jsx    # Become owner signup
│   │   ├── 📄 Discover.jsx       # Community
│   │   ├── 📄 ForgotPassword.jsx # Password reset
│   │   ├── 📄 ResetPassword.jsx  # Password reset form
│   │   ├── 📄 Signup.jsx         # Signup form
│   │   └── 📄 ImageUploadTest.jsx # Upload test page
│   │
│   ├── 📁 components/            # Reusable components
│   │   ├── 📁 common/            # Shared components
│   │   │   ├── Header.jsx        # Navigation bar
│   │   │   ├── Footer.jsx        # Footer
│   │   │   ├── BottomNav.jsx     # Mobile nav
│   │   │   └── ... (others)
│   │   │
│   │   ├── 📁 home/              # Homepage components
│   │   │   ├── HeroSection.jsx
│   │   │   ├── FeaturesSection.jsx
│   │   │   ├── TestimonialsSection.jsx
│   │   │   └── ... (others)
│   │   │
│   │   ├── 📁 about/             # About page components
│   │   ├── 📁 contact/           # Contact page components
│   │   ├── 📁 products/          # Product components
│   │   ├── 📁 animations/        # Animation components
│   │   │   ├── GSAPReveal.jsx
│   │   │   └── GSAPTabTransition.jsx
│   │   └── ... (others)
│   │
│   └── 📁 assets/                # Images, fonts
│
├── 📁 backend/                   # Backend source code
│   ├── 📄 server.js              # Express server entry
│   ├── 📄 package.json           # Backend dependencies
│   │
│   ├── 📁 config/                # Configuration
│   │   ├── 📄 firebase.js        # Firebase Admin SDK
│   │   └── 📄 collections.js     # Firestore collection names
│   │
│   ├── 📁 middleware/            # Express middleware
│   │   ├── 📄 auth.js            # Authentication & authorization
│   │   ├── 📄 errorHandler.js    # Error handling
│   │   └── 📄 fileUpload.js      # Multer file upload
│   │
│   ├── 📁 routes/                # API routes
│   │   ├── 📄 authRoutes.js      # Auth endpoints
│   │   ├── 📄 userRoutes.js      # User endpoints
│   │   ├── 📄 productRoutes.js   # Product endpoints
│   │   ├── 📄 cartRoutes.js      # Cart endpoints
│   │   ├── 📄 wishlistRoutes.js  # Wishlist endpoints
│   │   ├── 📄 orderRoutes.js     # Order endpoints
│   │   └── 📄 virtualClosetRoutes.js
│   │
│   ├── 📁 controllers/           # Route handlers
│   │   ├── 📄 authController.js
│   │   ├── 📄 userController.js
│   │   ├── 📄 productController.js
│   │   ├── 📄 cartController.js
│   │   ├── 📄 wishlistController.js
│   │   ├── 📄 orderController.js
│   │   └── 📄 virtualClosetController.js
│   │
│   ├── 📁 services/              # Business logic
│   │   └── 📄 cloudinaryService.js # Cloudinary integration
│   │
│   ├── 📁 scripts/               # Utility scripts
│   │   └── 📄 seed.js            # Database seeding
│   │
│   └── 📁 node_modules/          # Dependencies
│
├── 📁 readme/                    # Documentation
│   ├── 📄 API_ROUTES_REFERENCE.md
│   ├── 📄 BACKEND_COMPLETE.md
│   ├── 📄 BACKEND_GUIDE.md
│   ├── 📄 FRONTEND_GUIDE.md
│   ├── 📄 QUICK_REFERENCE.md
│   └── ... (others)
│
└── 📄 PROJECT_DOCUMENTATION.md   # This file
```

---

## ✅ Work Completed

### Phase 1: Foundation & Setup ✅
- [x] Project initialization with Vite + React
- [x] Firebase setup (Authentication, Firestore, Storage)
- [x] Express.js backend server setup
- [x] Environment configuration
- [x] TailwindCSS styling setup
- [x] Git repository initialized

### Phase 2: Authentication System ✅
- [x] Email/Password registration
- [x] Email/Password login
- [x] Google OAuth integration
- [x] Facebook OAuth integration
- [x] Password reset functionality
- [x] Token verification middleware
- [x] User profile sync (Firebase → Firestore)
- [x] Account deactivation
- [x] Automatic user creation on first login
- [x] Auth context with global state

### Phase 3: User Management ✅
- [x] User profile display
- [x] Profile editing
- [x] Avatar/photo upload
- [x] Gender selection (for recommendations)
- [x] Address management (add, edit, delete)
- [x] Default address selection
- [x] User preferences management

### Phase 4: Product Management ✅
- [x] Product browse functionality
- [x] Product search & filtering
- [x] Category filtering (Men, Women, Accessories)
- [x] Product sorting (price, newest, rating)
- [x] Product detail page
- [x] Image gallery
- [x] Stock availability display
- [x] Reviews & ratings display

### Phase 5: Shopping Experience ✅
- [x] Add to cart functionality
- [x] Remove from cart
- [x] Cart quantity management
- [x] Cart persistence
- [x] Real-time cart updates
- [x] Cart totals calculation
- [x] Add to wishlist
- [x] Remove from wishlist
- [x] Wishlist persistence

### Phase 6: Checkout & Orders ✅
- [x] Checkout process
- [x] Address selection
- [x] Rental period selection
- [x] Order summary
- [x] Order creation
- [x] Order confirmation page
- [x] Order history
- [x] Order tracking (placeholder)
- [x] Order status management

### Phase 7: Virtual Closet ✅
- [x] Upload outfit images
- [x] Create looks/sets
- [x] Image storage on Cloudinary
- [x] Metadata storage in Firestore
- [x] List all looks
- [x] Delete looks
- [x] Delete associated Cloudinary images
- [x] Real-time sync

### Phase 8: Owner Dashboard ✅
- [x] Become owner registration
- [x] Owner profile setup
- [x] Product listing as owner
- [x] Inventory management
- [x] Price setting
- [x] Product image upload
- [x] View earnings
- [x] Orders received

### Phase 9: UI/UX & Frontend Polish ✅
- [x] Responsive design (mobile, tablet, desktop)
- [x] Navigation header with auth state
- [x] Footer with links
- [x] Loading states on components
- [x] Error handling & user feedback
- [x] Empty state messages
- [x] Form validation
- [x] Toast notifications (ready for implementation)
- [x] GSAP animations
- [x] Smooth page transitions

### Phase 10: Backend Infrastructure ✅
- [x] Express.js server with routing
- [x] Firebase Admin SDK integration
- [x] Firestore database operations
- [x] Authentication middleware
- [x] Authorization middleware
- [x] Error handling middleware
- [x] CORS configuration
- [x] Rate limiting
- [x] Request logging (Morgan)
- [x] Security headers (Helmet)
- [x] Cloudinary file upload integration

### Phase 11: API Development ✅
- [x] Auth endpoints (sync, me, logout, delete)
- [x] User endpoints (profile, addresses)
- [x] Product endpoints (list, detail, featured)
- [x] Cart endpoints (get, add, remove, clear)
- [x] Wishlist endpoints (get, toggle)
- [x] Order endpoints (create, list, detail)
- [x] Virtual closet endpoints (upload, list, delete)

### Phase 12: Recent Improvements ✅
- [x] Enhanced authentication flow logging
- [x] Detailed API request logging
- [x] Backend auth middleware logging
- [x] Better error messages
- [x] Token refresh improvements
- [x] Auto sign-out on 401 errors
- [x] Cloudinary folder structure
- [x] Project rebranding (Renclo → WardroWave)
- [x] Firebase project consolidation (wardrowave)

---

## 🔧 Backend Services

### Cloudinary Service
**File:** `backend/services/cloudinaryService.js`

Handles image upload, transformation, and deletion.

```javascript
uploadToCloudinary(fileBuffer, filename, folder)
// Uploads files to Cloudinary with optimization

deleteFromCloudinary(publicId)
// Deletes files from Cloudinary

getTransformedUrl(publicId, options)
// Gets optimized image URLs with transformations
```

---

## 🎨 Frontend Components

### Context Providers
- **AuthContext** - User authentication state
- **CartContext** - Shopping cart state  
- **WishlistContext** - Wishlist state

### Layout Components
- **Header** - Navigation bar with auth state
- **Footer** - Footer with links
- **BottomNav** - Mobile bottom navigation

### Page Components
- **Home** - Landing page with features
- **Products** - Browse all products
- **ProductDetails** - Single product page
- **Cart** - Shopping cart
- **Checkout** - Checkout process
- **Rentals** - User rental history
- **UserProfile** - Profile management
- **OwnerDashboard** - Owner panel
- **VirtualCloset** - Wardrobe management
- **Login/Signup** - Authentication pages
- **About/Contact** - Info pages

---

## 🔧 Recent Fixes & Improvements

### Authentication Flow Fixes
**Date:** April 12, 2026

1. **Firebase Project Consolidation**
   - Issue: Frontend using "renclo" project, backend using "wardrowave"
   - Solution: Updated frontend Firebase config to use wardrowave
   - Result: Tokens now verify correctly

2. **Enhanced Logging**
   - Added `[API]` prefixed logs for all API requests
   - Added `[Auth]` prefixed logs for authentication steps
   - Detailed token retrieval status logging
   - Better error context (401 errors show token status)

3. **Token Retrieval Improvements**
   - Force token refresh before API calls: `getIdToken(true)`
   - Added try-catch for token retrieval
   - Graceful handling when token unavailable
   - Auto sign-out on 401 errors

4. **Error Context**
   - API errors now include token availability
   - Better error messages shown to users
   - Detailed backend logging for debugging

### Project Rebranding
- Updated all mentions from "Renclo" to "WardroWave"
- Updated Firebase config
- Updated package.json files
- Updated all UI text and email addresses
- Updated Cloudinary folder structures

---

## 🔐 Environment Setup

### Frontend Environment Variables (`.env.production`)
```env
VITE_FIREBASE_API_KEY=AIzaSyCgOBfDTfO13kQAnyQGXNeMg_OY1GpqRko
VITE_FIREBASE_AUTH_DOMAIN=wardrowave.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=wardrowave
VITE_FIREBASE_STORAGE_BUCKET=wardrowave.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=1092423491775
VITE_FIREBASE_APP_ID=1:1092423491775:web:6e60acd1a1fdcf1885e60a
VITE_FIREBASE_MEASUREMENT_ID=G-5MWLTNY8H4
VITE_API_URL=https://wardrowave.vercel.app
```

### Backend Environment Variables (`.env`)
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

FIREBASE_PROJECT_ID=wardrowave
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@wardrowave.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=<private key from Firebase Console>

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=200

CLOUDINARY_CLOUD_NAME=doiyd6zkx
CLOUDINARY_API_KEY=411399953565276
CLOUDINARY_API_SECRET=11bsospLjwkR14gf_MjTxTi3XPE
```

---

## 🚀 Deployment

### Frontend Deployment (Vercel)
1. Push to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Automatic deployment on push to main branch

### Backend Deployment (Vercel Serverless)
1. Deploy to Vercel as serverless functions
2. Set backend environment variables
3. Update FRONTEND_URL to production domain

### Database (Firebase)
- Firestore database: Automatically synced
- Authentication: Managed by Firebase
- Storage: Firebase Storage for rules

---

## 🔮 Future Roadmap

### Phase 13: Payment Integration 🔄
- [ ] Stripe/PayPal integration
- [ ] Payment processing
- [ ] Refund handling
- [ ] Invoice generation

### Phase 14: Advanced Features 🔄
- [ ] AI-powered style recommendations
- [ ] Virtual try-on (AR)
- [ ] Size recommendations
- [ ] Similar product suggestions
- [ ] Personalized feed

### Phase 15: Community Features 🔄
- [ ] Social sharing
- [ ] User reviews & ratings
- [ ] Comments on looks
- [ ] Favorites/bookmarks
- [ ] User messaging

### Phase 16: Analytics & Admin 🔄
- [ ] Admin dashboard
- [ ] Sales analytics
- [ ] User analytics
- [ ] Popular items tracking
- [ ] Vendor analytics

### Phase 17: Performance Optimization 🔄
- [ ] Lazy loading images
- [ ] Code splitting
- [ ] Caching strategies
- [ ] Database indexing
- [ ] CDN optimization

### Phase 18: Mobile App 🔄
- [ ] React Native mobile app
- [ ] Push notifications
- [ ] Offline mode
- [ ] Mobile payments

---

## 📊 Current Metrics

- **Frontend Files:** ~50+ React components
- **Backend Files:** ~10 controllers, 7 route files
- **Firestore Collections:** 8+ collections
- **API Routes:** 30+ endpoints
- **Lines of Code:** ~10,000+
- **Documentation Pages:** 12+

---

## 🤝 Contributing

If you want to contribute to WardroWave:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/YourFeature`)
3. Commit changes (`git commit -m 'Add YourFeature'`)
4. Push to branch (`git push origin feature/YourFeature`)
5. Open Pull Request

---

## 📞 Support & Contact

- **Email:** support@wardrowave.com
- **Website:** https://wardrowave.vercel.app
- **GitHub:** https://github.com/Codesrhereaman/wardrowave

---

## 📜 License

MIT License - See LICENSE file for details

---

## 🎉 Acknowledgments

- Firebase team for excellent backend services
- Vercel for amazing hosting
- TailwindCSS for utility-first CSS
- GSAP for smooth animations
- Cloudinary for image management

---

**Last Updated:** April 12, 2026  
**Project Version:** 2.0.0  
**Status:** ✅ Active Development

---

> Built with ❤️ for the fashion enthusiasts of the world
> 
> **WardroWave** - Rent Luxury, Create Style, Earn Income
