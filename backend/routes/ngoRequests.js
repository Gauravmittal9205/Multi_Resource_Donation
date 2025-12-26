const express = require('express');

const { firebaseProtect, adminProtect } = require('../middleware/firebaseAuth');
const {
  createNgoRequest,
  getMyRequests,
  getRequest,
  getRequestAdmin,
  updateRequest,
  deleteRequest,
  getNgoDashboard,
  getAllRequests,
  updateRequestStatus,
  getNgosWithActiveRequests
} = require('../controllers/ngoRequests');

const router = express.Router();

// Admin routes (must be before firebaseProtect middleware)
router.route('/admin/all').get(adminProtect, getAllRequests);
router.route('/admin/active').get(adminProtect, getNgosWithActiveRequests);
router.route('/admin/:id').get(adminProtect, getRequestAdmin).put(adminProtect, updateRequestStatus);

// Firebase protected routes (NGO identity from Firebase token)
router.use(firebaseProtect);

router.route('/dashboard').get(getNgoDashboard);
router.route('/').post(createNgoRequest).get(getMyRequests);
router.route('/:id').get(getRequest).put(updateRequest).delete(deleteRequest);

module.exports = router;


