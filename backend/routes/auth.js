const express = require('express');
const { 
  register, 
  login, 
  getMe,
  getUserByFirebaseUid,
  deleteMe,
  logout 
} = require('../controllers/auth');

const router = express.Router();

const { protect } = require('../middleware/auth');
const { firebaseProtect } = require('../middleware/firebaseAuth');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.get('/user/:firebaseUid', getUserByFirebaseUid);

// Firebase protected route
router.delete('/delete-me', firebaseProtect, deleteMe);

// Protected routes
router.get('/me', protect, getMe);
router.get('/logout', protect, logout);

module.exports = router;
