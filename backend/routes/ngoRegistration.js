const express = require('express');

const { firebaseProtect, adminProtect } = require('../middleware/firebaseAuth');
const {
  createNgoRegistration,
  getMyRegistration,
  getAllRegistrations,
  getRegistration,
  updateRegistrationStatus
} = require('../controllers/ngoRegistration');

const router = express.Router();

// Admin routes (must be before firebaseProtect middleware)
router.route('/admin/all').get(adminProtect, getAllRegistrations);
router.route('/admin/:id').get(adminProtect, getRegistration).put(adminProtect, updateRegistrationStatus);

// Firebase protected routes
router.use(firebaseProtect);

router.route('/').post(createNgoRegistration).get(getMyRegistration);

module.exports = router;


