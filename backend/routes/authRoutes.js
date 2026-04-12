const express = require('express');
const router = express.Router();
const { getMe, syncProfile, logout, deleteAccount } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// sync-profile is called right after signup and doesn't require prior authentication
router.post('/sync-profile', protect, syncProfile);

// All other auth routes require valid authentication
router.use(protect);

router.get('/me', getMe);
router.post('/logout', logout);
router.delete('/delete-account', deleteAccount);

module.exports = router;
