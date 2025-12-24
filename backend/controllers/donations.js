const Donation = require('../models/Donation');
const asyncHandler = require('../middleware/async');

const toStartOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);

// @desc    Create donation (Donor)
// @route   POST /api/v1/donations
// @access  Private (Firebase)
exports.createDonation = asyncHandler(async (req, res) => {
  const donorFirebaseUid = req.firebaseUid;

  const {
    resourceType,
    quantity,
    unit,
    address,
    pickup,
    notes,
    images,
    details
  } = req.body || {};

  const donation = await Donation.create({
    donorFirebaseUid,
    resourceType,
    quantity: Number(quantity),
    unit,
    address,
    pickup: {
      pickupDate: pickup?.pickupDate ? new Date(pickup.pickupDate) : undefined,
      timeSlot: pickup?.timeSlot
    },
    notes: notes || '',
    images: Array.isArray(images) ? images : [],
    details: details || {},
    status: 'pending'
  });

  res.status(201).json({
    success: true,
    data: donation
  });
});

// @desc    Get donor dashboard summary
// @route   GET /api/v1/donations/dashboard
// @access  Private (Firebase)
exports.getDonorDashboard = asyncHandler(async (req, res) => {
  const donorFirebaseUid = req.firebaseUid;

  const totalDonations = await Donation.countDocuments({ donorFirebaseUid });
  const completedDonations = await Donation.countDocuments({
    donorFirebaseUid,
    status: 'completed'
  });
  const activePickups = await Donation.countDocuments({
    donorFirebaseUid,
    status: { $in: ['pending', 'assigned', 'picked'] }
  });

  const recentDonations = await Donation.find({ donorFirebaseUid })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  // Activity: last 12 months counts by month
  const now = new Date();
  const months = [];
  for (let i = 11; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      year: d.getFullYear(),
      month: d.getMonth(),
      label: d.toLocaleString('en-US', { month: 'short' }),
      start: toStartOfMonth(d),
      end: new Date(d.getFullYear(), d.getMonth() + 1, 1)
    });
  }

  const activity = await Promise.all(
    months.map(async (m) => {
      const count = await Donation.countDocuments({
        donorFirebaseUid,
        createdAt: { $gte: m.start, $lt: m.end }
      });
      return { label: m.label, count };
    })
  );

  res.status(200).json({
    success: true,
    data: {
      summary: {
        totalDonations,
        activePickups,
        completedDonations
      },
      activity,
      recentDonations
    }
  });
});

// @desc    List donor donations
// @route   GET /api/v1/donations
// @access  Private (Firebase)
exports.listMyDonations = asyncHandler(async (req, res) => {
  const donorFirebaseUid = req.firebaseUid;
  const { status } = req.query;

  const query = { donorFirebaseUid };
  if (status) query.status = status;

  const donations = await Donation.find(query).sort({ createdAt: -1 }).lean();

  res.status(200).json({
    success: true,
    count: donations.length,
    data: donations
  });
});
