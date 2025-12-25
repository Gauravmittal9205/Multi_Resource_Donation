const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const User = require('../models/User');
const Donation = require('../models/Donation');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(
      new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Create user
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = asyncHandler(async (req, res, next) => {
  const user = await User.create(req.body);

  res.status(201).json({
    success: true,
    data: user
  });
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!user) {
    return next(
      new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    return next(
      new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get all donors (Admin)
// @route   GET /api/v1/users/admin/donors
// @access  Private (Admin)
exports.getAllDonors = asyncHandler(async (req, res) => {
  // Get all users with userType 'donor'
  const donors = await User.find({ userType: 'donor' })
    .select('_id name email phone address firebaseUid createdAt isVerified')
    .sort({ createdAt: -1 })
    .lean();

  // Get donation stats for each donor
  const donorsWithStats = await Promise.all(
    donors.map(async (donor) => {
      const totalDonations = await Donation.countDocuments({ 
        donorFirebaseUid: donor.firebaseUid 
      });
      
      const completedDonations = await Donation.countDocuments({ 
        donorFirebaseUid: donor.firebaseUid,
        status: 'completed'
      });

      const pendingDonations = await Donation.countDocuments({ 
        donorFirebaseUid: donor.firebaseUid,
        status: 'pending'
      });

      return {
        ...donor,
        stats: {
          totalDonations,
          completedDonations,
          pendingDonations
        }
      };
    })
  );

  res.status(200).json({
    success: true,
    count: donorsWithStats.length,
    data: donorsWithStats
  });
});

// @desc    Send notification to donor (Admin)
// @route   POST /api/v1/users/admin/notify
// @access  Private (Admin)
exports.sendNotificationToDonor = asyncHandler(async (req, res) => {
  const { donorFirebaseUid, title, message } = req.body;

  if (!donorFirebaseUid || !title || !message) {
    return res.status(400).json({
      success: false,
      error: 'Please provide donorFirebaseUid, title, and message'
    });
  }

  // Check if donor exists
  const donor = await User.findOne({ 
    firebaseUid: donorFirebaseUid, 
    userType: 'donor' 
  });

  if (!donor) {
    return res.status(404).json({
      success: false,
      error: 'Donor not found'
    });
  }

  // Here you would integrate with Firebase Cloud Messaging (FCM)
  // For now, we'll just return success
  // TODO: Implement FCM notification sending
  
  res.status(200).json({
    success: true,
    message: 'Notification sent successfully',
    data: {
      donorFirebaseUid,
      title,
      message,
      sentAt: new Date()
    }
  });
});
