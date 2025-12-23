const express = require('express');
const { 
  register, 
  login, 
  getMe,
  getUserByFirebaseUid,
  logout 
} = require('../controllers/auth');

const router = express.Router();

const { protect } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.get('/user/:firebaseUid', getUserByFirebaseUid);

// Protected routes
router.get('/me', protect, getMe);
router.get('/logout', protect, logout);

module.exports = router;
