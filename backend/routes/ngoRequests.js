const express = require('express');

const { firebaseProtect, adminProtect } = require('../middleware/firebaseAuth');
const {
  createNgoRequest,
  getMyRequests,
  getRequest,
  updateRequest,
  deleteRequest,
  getNgoDashboard,
  getAllRequests,
  updateRequestStatus
} = require('../controllers/ngoRequests');

const router = express.Router();

// Admin routes (must be before firebaseProtect middleware)
router.route('/admin/all').get(adminProtect, getAllRequests);
router.route('/admin/:id').put(adminProtect, updateRequestStatus);

// Firebase protected routes (NGO identity from Firebase token)
router.use(firebaseProtect);

router.route('/dashboard').get(getNgoDashboard);
router.route('/').post(createNgoRequest).get(getMyRequests);
router.route('/:id').get(getRequest).put(updateRequest).delete(deleteRequest);

module.exports = router;

