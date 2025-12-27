const express = require('express');
const { 
  register, 
  login, 
  getMe,
  getUserByFirebaseUid,
  getUserByEmail,
  deleteMe,
  logout,
  adminLogin,
  checkAdmin,
  sendOTP,
  verifyOTP,
  debugOTP,
  updateFirebaseUid
} = require('../controllers/auth');

const router = express.Router();

const { protect } = require('../middleware/auth');
const { firebaseProtect } = require('../middleware/firebaseAuth');

// Public routes
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/debug-otp', debugOTP);
router.post('/register', register);
router.put('/update-firebase-uid', updateFirebaseUid);
router.post('/login', login);
router.post('/admin/login', adminLogin);
router.get('/admin/check', checkAdmin);
router.get('/user/:firebaseUid', getUserByFirebaseUid);
router.get('/user-by-email/:email', getUserByEmail);

// Firebase protected route
router.delete('/delete-me', firebaseProtect, deleteMe);

// Protected routes
router.get('/me', protect, getMe);
router.get('/logout', protect, logout);

module.exports = router;
