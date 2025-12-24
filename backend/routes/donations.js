const express = require('express');

const { firebaseProtect } = require('../middleware/firebaseAuth');
const {
  createDonation,
  getDonorDashboard,
  listMyDonations
} = require('../controllers/donations');

const router = express.Router();

// Firebase protected routes (donor identity from Firebase token)
router.use(firebaseProtect);

router.route('/dashboard').get(getDonorDashboard);

router.route('/').post(createDonation).get(listMyDonations);

module.exports = router;
