const express = require('express');

const { firebaseProtect, adminProtect } = require('../middleware/firebaseAuth');
const {
  createFeedback,
  getMyFeedback,
  getFeedback,
  updateFeedback,
  deleteFeedback,
  getAllFeedback,
  updateFeedbackStatus
} = require('../controllers/feedback');

const router = express.Router();

// Admin routes (must be before firebaseProtect middleware)
router.route('/admin/all').get(adminProtect, getAllFeedback);
router.route('/admin/:id').put(adminProtect, updateFeedbackStatus);

// Firebase protected routes (NGO identity from Firebase token)
router.use(firebaseProtect);

router.route('/').post(createFeedback).get(getMyFeedback);
router.route('/:id').get(getFeedback).put(updateFeedback).delete(deleteFeedback);

module.exports = router;

