const Donation = require('../models/Donation');
const User = require('../models/User');
const Profile = require('../models/Profile');
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
    status: { $in: ['assigned'] }
  });

  const ngosConnectedList = await Donation.distinct('assignedNGO.ngoFirebaseUid', {
    donorFirebaseUid,
    'assignedNGO.ngoFirebaseUid': { $ne: null }
  });

  const resourcesAgg = await Donation.aggregate([
    { $match: { donorFirebaseUid } },
    { $group: { _id: null, totalQuantity: { $sum: '$quantity' } } }
  ]);
  const resourcesDonated = Number(resourcesAgg?.[0]?.totalQuantity || 0);

  const foodDonations = await Donation.find({ donorFirebaseUid, resourceType: 'Food' })
    .select('details')
    .lean();
  const foodSavedKg = foodDonations.reduce((acc, d) => {
    const v = d?.details?.approxWeight;
    const n = typeof v === 'number' ? v : Number(v);
    return acc + (Number.isFinite(n) ? n : 0);
  }, 0);

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
      impact: {
        peopleHelped: completedDonations,
        ngosConnected: Array.isArray(ngosConnectedList) ? ngosConnectedList.length : 0,
        resourcesDonated,
        foodSavedKg
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

// @desc    Get all NGOs for admin
// @route   GET /api/v1/donations/admin/ngos
// @access  Private (Admin)
exports.getAllNGOs = asyncHandler(async (req, res) => {
  const ngos = await User.find({ userType: 'ngo', isVerified: true })
    .select('_id name email organizationName firebaseUid')
    .lean();

  res.status(200).json({
    success: true,
    count: ngos.length,
    data: ngos
  });
});

// @desc    Update donation (assign NGO and change status)
// @route   PUT /api/v1/donations/admin/:id
// @access  Private (Admin)
exports.updateDonation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { ngoFirebaseUid, status } = req.body;
  const adminFirebaseUid = req.firebaseUid;

  const donation = await Donation.findById(id);
  if (!donation) {
    return res.status(404).json({
      success: false,
      error: 'Donation not found'
    });
  }

  // Update status if provided
  if (status) {
    donation.status = status;
  }

  // Assign NGO if provided
  if (ngoFirebaseUid) {
    const ngo = await User.findOne({ firebaseUid: ngoFirebaseUid, userType: 'ngo' });
    if (!ngo) {
      return res.status(400).json({
        success: false,
        error: 'NGO not found'
      });
    }

    donation.assignedNGO = {
      ngoFirebaseUid: ngoFirebaseUid,
      ngoName: ngo.organizationName || ngo.name,
      assignedAt: new Date(),
      assignedBy: adminFirebaseUid
    };

    // If status is not explicitly set and NGO is assigned, set status to 'assigned'
    if (!status) {
      donation.status = 'assigned';
    }
  }

  await donation.save();

  res.status(200).json({
    success: true,
    data: donation
  });
});

// @desc    Get all donations for admin
// @route   GET /api/v1/donations/admin/all
// @access  Private (Admin)
exports.getAllDonations = asyncHandler(async (req, res) => {
  const { status, resourceType, city, startDate, endDate } = req.query;

  // Build query
  const query = {};
  if (status) query.status = status;
  if (resourceType) query.resourceType = resourceType;
  if (city) query['address.city'] = new RegExp(city, 'i');
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  // Fetch donations with donor information
  const donations = await Donation.find(query)
    .sort({ createdAt: -1 })
    .lean();

  // Get donor information for each donation
  const donationsWithDonorInfo = await Promise.all(
    donations.map(async (donation) => {
      // Try to get donor name from User model
      let donorName = 'Unknown Donor';
      let donorEmail = '';
      let donorPhone = '';

      const user = await User.findOne({ firebaseUid: donation.donorFirebaseUid });
      if (user) {
        donorName = user.name;
        donorEmail = user.email;
        donorPhone = user.phone || '';
      } else {
        // Try Profile model
        const profile = await Profile.findOne({ firebaseUid: donation.donorFirebaseUid });
        if (profile && profile.basic) {
          donorName = profile.basic.name || donorName;
          donorEmail = profile.basic.email || donorEmail;
          donorPhone = profile.basic.phone || donorPhone;
        }
      }

      return {
        ...donation,
        donorName,
        donorEmail,
        donorPhone
      };
    })
  );

  res.status(200).json({
    success: true,
    count: donationsWithDonorInfo.length,
    data: donationsWithDonorInfo
  });
});
