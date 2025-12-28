const express = require('express');
const { 
  register, 
  login, 
  getMe,
  getUserByFirebaseUid,
  getUserByEmail,
  getUserByPhone,
  registerWithPhone,
  deleteMe,
  logout,
  adminLogin,
  checkAdmin,
  sendOTP,
  verifyOTP,
  debugOTP,
  updateFirebaseUid
} = require('../controllers/auth');

const { 
  sendPhoneOTP, 
  verifyPhoneOTP 
} = require('../controllers/phoneVerification');

const router = express.Router();

const { protect } = require('../middleware/auth');
const { firebaseProtect } = require('../middleware/firebaseAuth');

// Public routes
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/debug-otp', debugOTP);
router.post('/send-phone-otp', sendPhoneOTP);
router.post('/verify-phone-otp', verifyPhoneOTP);
router.post('/register', register);
router.put('/update-firebase-uid', updateFirebaseUid);
router.post('/login', login);
router.post('/admin/login', adminLogin);
router.get('/admin/check', checkAdmin);
router.get('/user/:firebaseUid', getUserByFirebaseUid);
router.get('/user-by-email/:email', getUserByEmail);
router.get('/user-by-phone/:phone', getUserByPhone);
router.post('/register-phone', registerWithPhone);

// Firebase protected route
router.delete('/delete-me', firebaseProtect, deleteMe);

// Protected routes
router.get('/me', protect, getMe);
router.get('/logout', protect, logout);

module.exports = router;
