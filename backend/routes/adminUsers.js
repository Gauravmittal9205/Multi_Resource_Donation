const express = require('express');
const { adminProtect } = require('../middleware/firebaseAuth');
const { getAllDonors, sendNotificationToDonor } = require('../controllers/users');

const router = express.Router();

// Admin routes for user management
router.route('/donors').get(adminProtect, getAllDonors);
router.route('/notify').post(adminProtect, sendNotificationToDonor);

module.exports = router;

