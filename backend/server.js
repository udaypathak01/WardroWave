require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

const { initFirebase } = require('./config/firebase');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { validateCloudinaryConfig } = require('./services/cloudinaryService');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const orderRoutes = require('./routes/orderRoutes');
const virtualClosetRoutes = require('./routes/virtualClosetRoutes');

// ─── Initialize Firebase ──────────────────────────────────────────────────────

initFirebase();

// ─── Validate Cloudinary Config ──────────────────────────────────────────────

const { isValid: cloudinaryConfigValid, missing: missingCloudinaryVars } = validateCloudinaryConfig();
if (!cloudinaryConfigValid) {
  console.warn(`⚠️  Cloudinary: Missing credentials (${missingCloudinaryVars.join(', ')})`);
  console.warn(`   → Image uploads will fail until these env vars are configured.`);
} else {
  console.log('✅ Cloudinary: Configuration valid');
}

// ─── App ──────────────────────────────────────────────────────────────────────

const app = express();

// ─── Security ─────────────────────────────────────────────────────────────────

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting — global
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 200,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// ─── Body Parsing ─────────────────────────────────────────────────────────────

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ─── Logging ──────────────────────────────────────────────────────────────────

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));
}

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: '🚀 WardroWave API is running',
    database: 'Firebase Firestore',
    auth: 'Firebase Authentication',
    timestamp: new Date().toISOString(),
  });
});

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to WardroWave Backend API',
    version: '2.0.0',
    stack: { auth: 'Firebase Auth', database: 'Firestore', server: 'Express.js' },
    endpoints: {
      auth:     'POST /api/auth/sync-profile  |  GET /api/auth/me  |  POST /api/auth/logout',
      users:    'GET|PUT /api/users/profile   |  GET|POST /api/users/addresses',
      products: 'GET /api/products            |  GET /api/products/featured',
      cart:     'GET /api/cart                |  POST /api/cart/add',
      wishlist: 'GET /api/wishlist            |  POST /api/wishlist/toggle',
      orders:   'POST /api/orders             |  GET /api/orders',
      closet:   'POST /api/virtual-closet/upload  |  GET /api/virtual-closet  |  DELETE /api/virtual-closet/:lookId',
    },
  });
});

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use('/api/auth',           authRoutes);
app.use('/api/users',          userRoutes);
app.use('/api/products',       productRoutes);
app.use('/api/cart',           cartRoutes);
app.use('/api/wishlist',       wishlistRoutes);
app.use('/api/orders',         orderRoutes);
app.use('/api/virtual-closet', virtualClosetRoutes);

// ─── Error Handling ───────────────────────────────────────────────────────────

app.use(notFound);
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 5000;

let server;
if (require.main === module) {
  server = app.listen(PORT, () => {
    console.log('\n══════════════════════════════════════════════');
    console.log('  🌊 WardroWave Backend  —  v2.0.0');
    console.log('══════════════════════════════════════════════');
    console.log(`  🚀 Server:    http://localhost:${PORT}`);
    console.log(`  🔥 Database:  Firebase Firestore`);
    console.log(`  🔐 Auth:      Firebase Authentication`);
    console.log(`  🌍 Env:       ${process.env.NODE_ENV || 'development'}`);
    console.log('══════════════════════════════════════════════\n');
  });
}

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  process.exit(1);
});

module.exports = app;
