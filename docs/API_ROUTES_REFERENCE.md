# 🔌 COMPLETE API ROUTES REFERENCE | WardroWave

## 📋 API Overview

**Base URL:** 
- Local: `http://localhost:5000/api`
- Production: `https://wardrowave-backend.vercel.app/api`

**Authentication:**
All endpoints require Firebase ID token in header:
```
Authorization: Bearer <FIREBASE_ID_TOKEN>
```

---

## 🔐 AUTHENTICATION ENDPOINTS

### **POST** `/auth/sync-profile`
Create or update user profile after Firebase auth.

**Request:**
```javascript
{
  fullName?: 'John Doe',        // Optional (uses Firebase name if not provided)
  phone?: '9876543210',          // Optional
  photoUrl?: 'https://...'       // Optional
}
```

**Response (201 Created):**
```javascript
{
  success: true,
  message: 'Profile created',
  data: {
    user: {
      uid: 'user123',
      email: 'user@example.com',
      fullName: 'John Doe',
      phone: '9876543210',
      role: 'user',
      photoUrl: 'https://...',
      createdAt: '2024-04-05T10:00:00Z'
    }
  }
}
```

**When Called:**
- After user signs up via Firebase
- After Google/Facebook login
- Frontend calls this to create backend profile

---

### **GET** `/auth/me`
Get current logged-in user profile.

**Response:**
```javascript
{
  success: true,
  data: {
    user: { ... } // Full user object
  }
}
```

---

### **POST** `/auth/logout`
Logout and revoke Firebase token.

**Response:**
```javascript
{
  success: true,
  message: 'Logged out successfully'
}
```

---

### **DELETE** `/auth/delete-account`
Delete user account (soft delete).

**Response:**
```javascript
{
  success: true,
  message: 'Account deleted successfully'
}
```

---

## 👤 USER ENDPOINTS

### **GET** `/users/profile`
Get current user's profile.

**Response:**
```javascript
{
  success: true,
  data: {
    user: {
      uid: 'user123',
      email: 'user@example.com',
      fullName: 'John Doe',
      phone: '9876543210',
      photoUrl: '...',
      role: 'user' | 'owner',
      addresses: [
        {
          id: 'addr1',
          street: '123 Main St',
          city: 'Delhi',
          state: 'Delhi',
          zipCode: '110001',
          isDefault: true
        }
      ],
      createdAt: '2024-04-05T10:00:00Z',
      updatedAt: '2024-04-05T10:00:00Z'
    }
  }
}
```

---

### **PUT** `/users/profile`
Update user profile.

**Request:**
```javascript
{
  fullName?: 'Jane Doe',
  phone?: '9876543211',
  photoUrl?: 'https://...'
}
```

**Response:**
```javascript
{
  success: true,
  message: 'Profile updated',
  data: { user: { ... } }
}
```

---

### **GET** `/users/addresses`
Get all user addresses.

**Response:**
```javascript
{
  success: true,
  data: {
    addresses: [
      {
        id: 'addr1',
        street: '123 Main St',
        city: 'Delhi',
        state: 'Delhi',
        zipCode: '110001',
        isDefault: true,
        createdAt: '2024-04-05'
      }
    ]
  }
}
```

---

### **POST** `/users/addresses`
Add new address.

**Request:**
```javascript
{
  street: '123 Main St',
  city: 'Delhi',
  state: 'Delhi',
  zipCode: '110001',
  isDefault: false
}
```

**Response:**
```javascript
{
  success: true,
  message: 'Address added',
  data: {
    address: {
      id: 'addr123',
      street: '123 Main St',
      city: 'Delhi',
      state: 'Delhi',
      zipCode: '110001',
      isDefault: false
    }
  }
}
```

---

### **PUT** `/users/addresses/:id`
Update address.

**Request:**
```javascript
{
  street?: '124 Main St',
  city?: 'Mumbai',
  zipCode?: '400001'
}
```

**Response:** Updated address object

---

### **DELETE** `/users/addresses/:id`
Delete address.

**Response:**
```javascript
{
  success: true,
  message: 'Address deleted'
}
```

---

## 🛍️ PRODUCT ENDPOINTS

### **GET** `/products`
Get all products with filtering, sorting, and pagination.

**Query Parameters:**
```
?page=1&limit=12&category=dress&priceMin=500&priceMax=5000&sort=price&search=saree
```

**Response:**
```javascript
{
  success: true,
  data: {
    products: [
      {
        id: 'prod123',
        title: 'Beautiful Dress',
        description: 'High-quality fabric...',
        category: 'dress',
        size: 'M',
        color: 'red',
        rentPrice: 1500,
        dailyPrice: 300,
        owner: {
          uid: 'owner123',
          fullName: 'Shop Owner'
        },
        images: [
          { url: 'https://...', publicId: '...' }
        ],
        rating: 4.5,
        reviews: 12,
        availability: true,
        quantity: 5,
        createdAt: '2024-04-05'
      }
    ],
    total: 150,
    page: 1,
    pages: 13,
    limit: 12
  }
}
```

---

### **GET** `/products/:id`
Get single product details.

**Response:**
```javascript
{
  success: true,
  data: {
    product: {
      id: 'prod123',
      title: 'Beautiful Dress',
      description: 'High-quality fabric...',
      category: 'dress',
      size: 'M',
      color: 'red',
      rentPrice: 1500,
      dailyPrice: 300,
      owner: {
        uid: 'owner123',
        fullName: 'Shop Owner',
        rating: 4.8,
        totalRentals: 250
      },
      images: [...],
      rating: 4.5,
      reviews: [
        {
          id: 'review123',
          reviewer: 'John Doe',
          rating: 5,
          comment: 'Excellent quality!',
          createdAt: '2024-04-01'
        }
      ],
      rentalPolicy: 'Returns within 7 days',
      careInstructions: 'Dry clean only',
      stockHistory: [
        {
          date: '2024-04-05',
          available: 5,
          rented: 2
        }
      ]
    }
  }
}
```

---

### **GET** `/products/featured`
Get featured/trending products.

**Response:** Array of product objects (same format as above)

---

### **GET** `/products/categories`
Get all available categories.

**Response:**
```javascript
{
  success: true,
  data: {
    categories: ['dress', 'saree', 'lehenga', 'accessories', 'menswear']
  }
}
```

---

### **POST** `/products` *(Owner only)*
Create new product.

**Request:**
```javascript
{
  title: 'Beautiful Dress',
  description: 'High-quality cotton dress...',
  category: 'dress',
  size: 'M',
  color: 'red',
  rentPrice: 1500,
  quantity: 5,
  images: ['file1', 'file2'],  // Cloudinary URLs
  careInstructions: 'Dry clean only'
}
```

**Response:**
```javascript
{
  success: true,
  message: 'Product created',
  data: {
    product: { id: 'prod123', ... }
  }
}
```

---

### **PUT** `/products/:id` *(Owner only)*
Update product.

**Request:** Partial product fields

**Response:** Updated product object

---

### **DELETE** `/products/:id` *(Owner only)*
Delete product (soft delete - sets availability to false).

**Response:**
```javascript
{
  success: true,
  message: 'Product deleted'
}
```

---

## 🛒 CART ENDPOINTS

### **GET** `/cart`
Get user's shopping cart.

**Response:**
```javascript
{
  success: true,
  data: {
    cart: {
      uid: 'user123',
      items: [
        {
          productId: 'prod123',
          title: 'Dress',
          price: 1500,
          quantity: 1,
          image: 'https://...',
          rentalStartDate: '2024-04-10',
          rentalEndDate: '2024-04-15',
          days: 5,
          totalPrice: 7500
        }
      ],
      totalPrice: 7500,
      itemCount: 1,
      updatedAt: '2024-04-05'
    }
  }
}
```

---

### **POST** `/cart/add`
Add item to cart.

**Request:**
```javascript
{
  productId: 'prod123',
  quantity: 1,
  rentalStartDate: '2024-04-10',
  rentalEndDate: '2024-04-15'
}
```

**Response:**
```javascript
{
  success: true,
  message: 'Item added to cart',
  data: {
    cart: { ... } // Updated cart
  }
}
```

---

### **PUT** `/cart/:productId`
Update item quantity in cart.

**Request:**
```javascript
{
  quantity: 2
}
```

**Response:** Updated cart object

---

### **DELETE** `/cart/:productId`
Remove item from cart.

**Response:**
```javascript
{
  success: true,
  message: 'Item removed from cart',
  data: { cart: { ... } }
}
```

---

### **POST** `/cart/clear`
Clear entire cart.

**Response:**
```javascript
{
  success: true,
  message: 'Cart cleared',
  data: { cart: { items: [], totalPrice: 0 } }
}
```

---

## 📦 ORDER ENDPOINTS

### **POST** `/orders`
Create new order (checkout).

**Request:**
```javascript
{
  items: [
    {
      productId: 'prod123',
      quantity: 1,
      rentalStartDate: '2024-04-10',
      rentalEndDate: '2024-04-15'
    }
  ],
  shippingAddressId: 'addr123',
  paymentMethod: 'razorpay' | 'upi' | 'card'
}
```

**Response:**
```javascript
{
  success: true,
  message: 'Order created',
  data: {
    order: {
      id: 'order123',
      uid: 'user123',
      items: [...],
      totalPrice: 7500,
      status: 'pending',
      paymentStatus: 'pending',
      shippingAddress: { ... },
      estimatedDelivery: '2024-04-08',
      rentalPeriod: {
        startDate: '2024-04-10',
        endDate: '2024-04-15'
      },
      tracking: null,
      createdAt: '2024-04-05T10:00:00Z'
    }
  }
}
```

---

### **GET** `/orders`
Get user's orders.

**Query:** `?page=1&limit=10&status=pending`

**Response:**
```javascript
{
  success: true,
  data: {
    orders: [...],
    total: 5,
    page: 1,
    pages: 1
  }
}
```

---

### **GET** `/orders/:id`
Get single order details.

**Response:** Single order object (detailed)

---

### **PUT** `/orders/:id` *(Owner only)*
Update order status.

**Request:**
```javascript
{
  status: 'shipped' | 'delivered' | 'returned' | 'completed',
  trackingNumber?: 'TRACK123'
}
```

**Response:** Updated order object

---

### **DELETE** `/orders/:id`
Cancel order (if not yet shipped).

**Response:**
```javascript
{
  success: true,
  message: 'Order cancelled',
  data: {
    refundAmount: 7500
  }
}
```

---

### **GET** `/orders/:id/tracking`
Get order tracking info.

**Response:**
```javascript
{
  success: true,
  data: {
    tracking: {
      status: 'shipped',
      trackingNumber: 'TRACK123',
      carrier: 'FedEx',
      lastUpdate: '2024-04-06T15:30:00Z',
      estimatedDelivery: '2024-04-08'
    }
  }
}
```

---

## ❤️ WISHLIST ENDPOINTS

### **GET** `/wishlist`
Get user's wishlist.

**Response:**
```javascript
{
  success: true,
  data: {
    wishlist: {
      uid: 'user123',
      productIds: ['prod123', 'prod124'],
      items: [
        {
          id: 'prod123',
          title: 'Dress',
          price: 1500,
          image: '...',
          rating: 4.5
        }
      ],
      count: 2
    }
  }
}
```

---

### **POST** `/wishlist/add`
Add item to wishlist.

**Request:**
```javascript
{
  productId: 'prod123'
}
```

**Response:** Updated wishlist

---

### **DELETE** `/wishlist/:productId`
Remove from wishlist.

**Response:** Updated wishlist

---

### **POST** `/wishlist/move-to-cart`
Move wishlist item to cart.

**Request:**
```javascript
{
  productId: 'prod123',
  quantity: 1,
  rentalStartDate: '2024-04-10',
  rentalEndDate: '2024-04-15'
}
```

**Response:** { success, cart, wishlist }

---

## 👔 VIRTUAL CLOSET ENDPOINTS

### **GET** `/virtual-closet`
Get user's virtual closet (all outfits).

**Response:**
```javascript
{
  success: true,
  data: {
    outfits: [
      {
        id: 'outfit123',
        uid: 'user123',
        name: 'Wedding Look',
        occasion: 'wedding',
        items: [
          {
            productId: 'prod123',
            title: 'Lehenga',
            image: '...',
            color: 'red'
          }
        ],
        createdAt: '2024-04-01'
      }
    ],
    count: 1
  }
}
```

---

### **POST** `/virtual-closet`
Create new outfit.

**Request:**
```javascript
{
  name: 'Wedding Look',
  occasion: 'wedding' | 'casual' | 'formal' | 'party',
  items: ['prod123', 'prod124'],
  description?: 'My favorite wedding outfit'
}
```

**Response:** Created outfit object

---

### **GET** `/virtual-closet/:id`
Get outfit details.

**Response:** Outfit object with all items expanded

---

### **PUT** `/virtual-closet/:id`
Update outfit.

**Request:**
```javascript
{
  name?: 'Updated Wedding Look',
  items?: ['prod123', 'prod125'],
  occasion?: 'formal'
}
```

**Response:** Updated outfit

---

### **DELETE** `/virtual-closet/:id`
Delete outfit.

**Response:**
```javascript
{
  success: true,
  message: 'Outfit deleted'
}
```

---

## 🔍 SEARCH & FILTER PARAMETERS

### Available Filters:

```javascript
// Category
?category=dress
?category=saree|lehenga  // Multiple (pipe-separated)

// Price
?priceMin=500&priceMax=5000

// Size
?size=XS|S|M|L|XL

// Color
?color=red|blue|black

// Rating
?minRating=4

// Availability
?availability=true|false

// Sorting
?sort=price        // Sort by price (ascending)
?sort=-price       // Sort by price (descending)
?sort=rating
?sort=newest

// Pagination
?page=1&limit=12

// Search
?search=beautiful+dress
```

---

## 📊 PAGINATION

All list endpoints support pagination:

```javascript
?page=1&limit=12

// Response includes:
{
  data: {
    items: [...],
    total: 150,
    page: 1,
    pages: 13,
    limit: 12,
    hasNextPage: true,
    hasPrevPage: false
  }
}
```

---

## ⚠️ ERROR RESPONSES

### **401 Unauthorized**
```javascript
{
  success: false,
  message: 'Unauthorized. Invalid or expired token.',
  status: 401
}
```

### **403 Forbidden**
```javascript
{
  success: false,
  message: 'You do not have permission for this action.',
  status: 403
}
```

### **404 Not Found**
```javascript
{
  success: false,
  message: 'Product not found',
  status: 404
}
```

### **400 Bad Request**
```javascript
{
  success: false,
  message: 'Invalid product ID format',
  status: 400,
  errors: [
    {
      field: 'productId',
      message: 'Must be a valid Firestore ID'
    }
  ]
}
```

### **500 Internal Server Error**
```javascript
{
  success: false,
  message: 'Server error',
  status: 500
}
```

---

## 🔐 Common Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict (duplicate) |
| 422 | Validation Error |
| 500 | Server Error |

---

## 📱 Testing with cURL

### Get all products
```bash
curl http://localhost:5000/api/products?limit=5
```

### Get with auth
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/auth/me
```

### Create order
```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "items": [{"productId": "prod123", "quantity": 1}],
    "shippingAddressId": "addr123",
    "paymentMethod": "card"
  }'
```

---

## 🧪 API Response Timing

- Simple GET: ~100ms
- Search/Filter: ~200-300ms
- Create/Update: ~150-250ms
- Image Upload: ~500-2000ms (depends on size)

---

**Last Updated:** April 5, 2026
**Reference:** BACKEND_GUIDE.md, PROJECT_DOCUMENTATION.md
