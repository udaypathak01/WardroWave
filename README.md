# 🌊 WardroWave - Project Repository

**Status:** ✅ Active Development  
**Last Updated:** April 12, 2026  
**Version:** 2.0.0

---

## 📁 Project Structure (Monorepo)

This is a **monorepo** with clearly organized **frontend** and **backend** applications:

```
wardrowave/
├── 📂 frontend/                    # React Frontend Application
│   ├── src/                        # React components, pages, and context
│   ├── public/                     # Static assets
│   ├── index.html
│   ├── package.json
│   ├── vite.config.mjs             # Vite build configuration
│   └── ...
│
├── 📂 backend/                     # Node.js/Express Backend Server
│   ├── api/                        # Vercel serverless entry point
│   │   └── index.js
│   ├── routes/                     # API route definitions
│   ├── controllers/                # Request handlers
│   ├── middleware/                 # Express middleware
│   ├── services/                   # Business logic
│   ├── config/                     # Backend configs
│   ├── server.js                   # Express server
│   ├── package.json
│   └── .env                        # Backend environment variables
│
├── 📂 config/                      # Shared Configuration Files
│   ├── firestore.rules             # Firestore security rules
│   └── deploy-rules.js             # Firebase deployment script
│
├── 📂 docs/                        # Project Documentation
│   ├── PROJECT_DOCUMENTATION.md    # Complete project guide
│   ├── API_ROUTES_REFERENCE.md
│   ├── BACKEND_GUIDE.md
│   ├── FRONTEND_GUIDE.md
│   ├── VERCEL_DEPLOYMENT.md
│   └── ... (other guides)
│
├── 🔧 Root Configuration Files
│   ├── firebase.json               # Firebase project configuration
│   ├── vercel.json                 # Vercel deployment config
│   ├── .firebaserc                 # Firebase CLI config
│   ├── .env                        # Shared environment variables
│   ├── .env.production             # Production environment variables
│   ├── .gitignore                  # Git ignore rules
│   └── README.md                   # This file
│
└── .git/                           # Git repository
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ or 20+
- **npm** or **yarn**
- **Firebase Account** (for authentication and database)

### Setup & Installation

#### 1. **Install Frontend Dependencies**
```bash
cd frontend
npm install
```

#### 2. **Install Backend Dependencies**
```bash
cd backend
npm install
```

#### 3. **Environment Variables**
Copy `.env.example` files and set up environment variables:

**Backend** (`backend/.env`):
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

FIREBASE_PROJECT_ID=wardrowave
FIREBASE_CLIENT_EMAIL=<your-firebase-email>
FIREBASE_PRIVATE_KEY=<your-firebase-key>

CLOUDINARY_CLOUD_NAME=<your-cloudinary-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>
```

### Development Server

#### **Terminal 1 - Frontend** (Port 5173)
```bash
cd frontend
npm run dev
```

#### **Terminal 2 - Backend** (Port 5000)
```bash
cd backend
npm run dev
```

Visit: `http://localhost:5173`

---

## 📚 Documentation

- **[PROJECT_DOCUMENTATION.md](docs/PROJECT_DOCUMENTATION.md)** - Complete project overview, architecture, API docs, database schema
- **[API_ROUTES_REFERENCE.md](docs/API_ROUTES_REFERENCE.md)** - All API endpoints with examples
- **[BACKEND_GUIDE.md](docs/BACKEND_GUIDE.md)** - Backend structure and setup
- **[FRONTEND_GUIDE.md](docs/FRONTEND_GUIDE.md)** - Frontend structure and components
- **[VERCEL_DEPLOYMENT.md](docs/VERCEL_DEPLOYMENT.md)** - Deployment instructions

---

## 🛠️ Technology Stack

### Frontend
- **React 19+** - UI Framework
- **Vite 5+** - Build tool
- **TailwindCSS 3.4+** - Styling
- **Firebase SDK 10+** - Authentication
- **GSAP 3.12+** - Animations
- **React Router 6+** - Routing

### Backend
- **Node.js 18+** - Runtime
- **Express.js 4.19+** - Web framework
- **Firebase Admin SDK 13+** - Authentication & Database
- **Firestore** - NoSQL Database
- **Cloudinary** - Image CDN

### Deployment
- **Vercel** - Frontend & Backend hosting
- **Firebase** - Database & Authentication

---

## 🔐 Important Files

### Configuration
- `firebase.json` - Firebase project config (references `config/firestore.rules`)
- `.firebaserc` - Firebase CLI config
- `vercel.json` - Vercel deployment config

### Security Rules
- `config/firestore.rules` - Firestore database security rules
- `config/deploy-rules.js` - Deployment automation script

### Environment
- `.env` - Development environment variables
- `.env.production` - Production environment variables

---

## 🚢 Deployment

### Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Your message"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel automatically finds `vercel.json` config

3. **Environment Variables**
   - Set variables in Vercel dashboard
   - Deploy automatically on push

**Vercel will:**
- Build: `cd frontend && npm run build`
- Output: `frontend/dist` (frontend)
- Deploy API: `backend/api/index.js` (Node.js serverless)

---

## 📊 Project Features

✅ **Authentication**
- Email/Password registration & login
- Google & Facebook OAuth
- Password reset

✅ **Shopping**
- Browse products
- Add to cart
- Add to wishlist
- Checkout & orders

✅ **Rental Management**
- Rent designer clothing
- Track rentals
- Manage bookings

✅ **Virtual Closet**
- Upload outfit images
- Create custom looks
- Manage wardrobe

✅ **Owner Dashboard**
- List products
- Manage inventory
- Track earnings

---

## 🔄 Project Workflow

### File Organization
- **Frontend code** → `frontend/src/`
- **Backend code** → `backend/` (routes, controllers, services)
- **Configuration** → `config/` (shared configs)
- **Documentation** → `docs/` (all guides and references)
- **Deployment** → `vercel.json`, `firebase.json` (at root)
- **Environment** → `.env`, `.env.production` (at root)

### Development Workflow
1. Make changes in `frontend/src/` or `backend/`
2. Test locally with `npm run dev`
3. Commit and push to GitHub
4. Vercel automatically deploys

### Adding Features
- Create components in `frontend/src/components/`
- Create API endpoints in `backend/routes/`
- Add controllers in `backend/controllers/`
- Update database schema in `config/firestore.rules`

---

## 🐛 Troubleshooting

### Frontend Issues
- **Port 5173 already in use?** → Change in `frontend/vite.config.mjs`
- **Dependencies issue?** → `cd frontend && npm install --legacy-peer-deps`
- **Hot reload not working?** → Restart dev server

### Backend Issues
- **Port 5000 already in use?** → Change in `backend/.env`
- **Firebase auth failing?** → Verify credentials in `.env`
- **Cloudinary upload errors?** → Check API keys in `backend/.env`

### Deployment Issues
- **Build failure on Vercel?** → Check `vercel.json` buildCommand path
- **API not responding?** → Verify `backend/api/index.js` exists
- **Environment variables missing?** → Set in Vercel dashboard

---

## 📝 Documentation Map

```
docs/
├── PROJECT_DOCUMENTATION.md         # Start here! Complete guide
├── API_ROUTES_REFERENCE.md          # All API endpoints
├── BACKEND_COMPLETE.md              # Backend implementation
├── BACKEND_GUIDE.md                 # Backend setup guide
├── FRONTEND_GUIDE.md                # Frontend setup guide
├── QUICK_REFERENCE.md               # Quick lookup
├── VERCEL_DEPLOYMENT.md             # Deployment guide
├── AI_TRYON_TESTING_GUIDE.md         # AI tryOn feature
├── VIRTUAL_CLOSET_BACKEND.md        # Virtual closet setup
└── BUILD_SUMMARY.md                 # Build summaries
```

---

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test locally
4. Push and create a Pull Request

---

## 📞 Support

For questions or issues:
- Check documentation in `docs/`
- Review code comments
- Check project logs

---

## 📄 License

MIT License - See LICENSE file for details

---

**Built with ❤️ for fashion enthusiasts worldwide**

🌊 **WardroWave** - Rent Luxury, Create Style, Earn Income
