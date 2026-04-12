# 🎯 Virtual Closet Backend Setup Guide

## 📋 Overview

The Virtual Closet feature now has a complete backend implementation with:
- **Firebase Firestore** for data persistence
- **Cloudinary** for image storage
- **Express.js** REST API
- **Multer** for file uploads
- **Firebase Auth** for user authentication

---

## 🚀 Quick Start (5 minutes)

### 1. Install Dependencies

```bash
cd backend
npm install
```

This installs:
- `cloudinary` - Image upload & management
- `multer` - File upload handling
- All other existing dependencies

### 2. Set Up Environment Variables

Copy the example file:

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-email
FIREBASE_PRIVATE_KEY=your-key

# Cloudinary (NEW)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### 3. Get Cloudinary Credentials

1. **Sign up** at https://cloudinary.com (free tier available)
2. Go to **Account Settings** → **API Keys**
3. Copy:
   - **Cloud Name**
   - **API Key**
   - **API Secret**
4. Paste into `.env` file

### 4. Start Backend

```bash
npm run dev
```

Should see:

```
══════════════════════════════════════════════
  🌊 WardroWave Backend  —  v2.0.0
══════════════════════════════════════════════
  🚀 Server:    http://localhost:5000
  🔥 Database:  Firebase Firestore
  🔐 Auth:      Firebase Authentication
  🌍 Env:       development
══════════════════════════════════════════════
```

---

## 📁 New Backend Files

### Controllers
- **`backend/controllers/virtualClosetController.js`**
  - Upload looks
  - Fetch all looks
  - Get single look
  - Update look metadata
  - Delete looks

### Routes
- **`backend/routes/virtualClosetRoutes.js`**
  - `POST /api/virtual-closet/upload` - Upload image
  - `GET /api/virtual-closet` - Get all looks
  - `GET /api/virtual-closet/:lookId` - Get one look
  - `PUT /api/virtual-closet/:lookId` - Update look
  - `DELETE /api/virtual-closet/:lookId` - Delete look

### Middleware
- **`backend/middleware/fileUpload.js`**
  - Multer configuration
  - File validation (image types, 5MB max)
  - Memory storage for temporary upload

### Services
- **`backend/services/cloudinaryService.js`**
  - Upload images to Cloudinary
  - Delete images from Cloudinary
  - Transform image URLs

### Frontend
- **`src/services/virtualClosetApi.js`**
  - Upload look
  - Fetch closet
  - Update/delete looks

---

## 🔌 API Endpoints

### Upload a New Look

```http
POST /api/virtual-closet/upload
Authorization: Bearer <Firebase_ID_Token>
Content-Type: multipart/form-data

Body:
  - image: <File>
  - occasion: "New Upload" (optional)
  - tags: ["Your Style", "✨"] (optional)

Response:
{
  "success": true,
  "data": {
    "id": "doc-id",
    "occasion": "New Upload",
    "image": {
      "secure_url": "https://res.cloudinary.com/...",
      "public_id": "wardrowave/virtual-closet/...",
      "width": 1000,
      "height": 1500
    },
    "tags": ["Your Style", "✨"],
    "isAIMatched": true,
    "createdAt": "2026-04-03T12:00:00Z"
  }
}
```

### Get All Looks

```http
GET /api/virtual-closet?limit=50&sort=newest
Authorization: Bearer <Firebase_ID_Token>

Response:
{
  "success": true,
  "data": {
    "looks": [
      {
        "id": "...",
        "occasion": "New Upload",
        "image": { ... },
        "tags": [...],
        "isAIMatched": true,
        "createdAt": "..."
      }
    ],
    "total": 5
  }
}
```

### Get Single Look

```http
GET /api/virtual-closet/look-id
Authorization: Bearer <Firebase_ID_Token>

Response:
{
  "success": true,
  "data": { ... look object ... }
}
```

### Update Look

```http
PUT /api/virtual-closet/look-id
Authorization: Bearer <Firebase_ID_Token>
Content-Type: application/json

Body:
{
  "occasion": "Summer Vacation",
  "tags": ["Beach", "Relaxed"]
}

Response:
{
  "success": true,
  "data": { ... updated look ... }
}
```

### Delete Look

```http
DELETE /api/virtual-closet/look-id
Authorization: Bearer <Firebase_ID_Token>

Response:
{
  "success": true,
  "message": "Look deleted successfully!"
}
```

---

## 📊 Database Structure

### Firestore Collection: `users/{userId}/virtual_closet/`

```
{
  id: "document_id",
  userId: "firebase_uid",
  occasion: "Summer Getaway",
  tags: ["Relaxed", "Beach"],
  image: {
    secure_url: "https://res.cloudinary.com/...",
    public_id: "wardrowave/virtual-closet/123456",
    width: 1000,
    height: 1500,
    bytes: 523456,
    format: "jpg"
  },
  isAIMatched: true,
  createdAt: "2026-04-03T12:00:00Z",
  updatedAt: "2026-04-03T12:00:00Z"
}
```

---

## 🔐 Authentication Flow

1. **Frontend** → Calls `firebaseUser.getIdToken()`
2. **Frontend** → Sends header: `Authorization: Bearer <token>`
3. **Backend** → Middleware verifies token in `auth.js`
4. **Backend** → Extracts `uid` from token
5. **Backend** → Uses `uid` to organize user's looks in Firestore

---

## 🛡️ Error Handling

All endpoints return structured error responses:

```json
{
  "success": false,
  "message": "Failed to upload image.",
  "error": "File too large"
}
```

---

## 🧪 Testing with cURL

```bash
# Upload (requires real image file)
curl -X POST http://localhost:5000/api/virtual-closet/upload \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -F "image=@/path/to/image.jpg" \
  -F "occasion=Summer Getaway"

# Get all looks
curl -X GET http://localhost:5000/api/virtual-closet \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"

# Delete look
curl -X DELETE http://localhost:5000/api/virtual-closet/look-id \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"
```

---

## 📝 Frontend Integration

The frontend already has the API service configured:

```javascript
import virtualClosetApi from '../../services/virtualClosetApi';

// Upload
const newLook = await virtualClosetApi.uploadLook(file, {
  occasion: 'Summer Vacation',
  tags: ['Beach', 'Relaxed']
});

// Fetch
const looks = await virtualClosetApi.getVirtualCloset({ limit: 50 });

// Delete
await virtualClosetApi.deleteLook(lookId);
```

---

## 🔄 Image Handling

### Upload Flow:
1. Frontend sends file via multipart/form-data
2. Multer stores in memory (temporary)
3. Backend uploads to Cloudinary
4. Cloudinary returns secure_url & public_id
5. Backend saves metadata to Firestore
6. Returns URL to frontend

### Delete Flow:
1. Get public_id from Firestore
2. Delete from Cloudinary using API
3. Delete metadata from Firestore
4. Return success

---

## 🚨 Troubleshooting

### **"CLOUDINARY_CLOUD_NAME is undefined"**
→ Check `.env` has all Cloudinary variables

### **"Unauthorized" 401 error**
→ Check Firebase token is valid and not expired

### **"File too large" error**
→ Max file size is 5MB. Edit in `fileUpload.js` if needed

### **"Look not found" 404**
→ Check lookId is correct and user owns the look

### **Images not persisting**
→ Check Firestore permission rules allow user to read/write their subcollection

---

## 📦 Future Enhancements

✅ Current:
- Single image upload
- Cloudinary storage
- Firestore metadata

Potential additions:
- Batch upload multiple images
- Image editing/filtering
- Sharing looks with friends
- AI recommendation engine
- AR try-on integration
- Export looks as PDF/image

---

## 📞 Support

For issues:
1. Check `.env` has all required variables
2. Verify Firebase & Cloudinary credentials
3. Check browser console for detailed errors
4. Verify network tab shows correct API calls

---

**Happy Closet Building! 👗✨**
