const express = require('express');

const { firebaseProtect, adminProtect } = require('../middleware/firebaseAuth');
const {
  createDonation,
  getDonorDashboard,
  verifyDonationOtp,
  listMyDonations,
  getAllDonations,
  getAllNGOs,
  updateDonation,
  getNgoAssignedDonations,
  getNgoLiveDonationsPool,
  assignVolunteer,
  updateNgoDonationStatus
} = require('../controllers/donations');

const router = express.Router();

// Admin routes (must be before firebaseProtect middleware)
router.route('/admin/all').get(adminProtect, getAllDonations);
router.route('/admin/ngos').get(adminProtect, getAllNGOs);
router.route('/admin/:id').put(adminProtect, updateDonation);

// Firebase protected routes (donor identity from Firebase token)
router.use(firebaseProtect);

router.route('/dashboard').get(getDonorDashboard);

router.route('/').post(createDonation).get(listMyDonations);

router.route('/:id/verify-otp').put(verifyDonationOtp);

// NGO routes
router.route('/ngo/assigned').get(getNgoAssignedDonations);
router.route('/ngo/live-pool').get(getNgoLiveDonationsPool);
router.route('/ngo/:id/assign-volunteer').put(assignVolunteer);
router.route('/ngo/:id/status').put(updateNgoDonationStatus);

module.exports = router;
