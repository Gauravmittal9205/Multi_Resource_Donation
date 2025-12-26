const Donation = require('../models/Donation');
const User = require('../models/User');
const Profile = require('../models/Profile');
const Notification = require('../models/Notification');
const Announcement = require('../models/Announcement');
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

  try {
    await Notification.create({
      recipientFirebaseUid: donorFirebaseUid,
      category: 'donations',
      title: 'Donation submitted',
      message: `Your ${resourceType} donation has been created successfully and is awaiting NGO assignment.`,
      read: false
    });
  } catch (_) {
    // non-blocking
  }

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
  const { ngoFirebaseUid, status, requestId, cancelReason } = req.body;
  const adminFirebaseUid = req.firebaseUid;

  const donation = await Donation.findById(id);
  if (!donation) {
    return res.status(404).json({
      success: false,
      error: 'Donation not found'
    });
  }

  const prevStatus = donation.status;
  const prevNgoUid = donation.assignedNGO?.ngoFirebaseUid || null;
  const prevNgoName = donation.assignedNGO?.ngoName || null;

  // Update status if provided
  if (status) {
    donation.status = status;
  }

  // Save cancellation reason only when donation is cancelled
  if (status === 'cancelled') {
    if (typeof cancelReason === 'string') {
      donation.cancelReason = cancelReason;
    }
    if (!donation.cancelledAt) {
      donation.cancelledAt = new Date();
    }
  }

  // Clear cancellation metadata if donation is moved away from cancelled
  if (status && status !== 'cancelled') {
    donation.cancelReason = '';
    donation.cancelledAt = null;
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

    console.log('Assigning donation:', {
      donationId: id,
      ngoFirebaseUid: ngoFirebaseUid,
      requestId: requestId
    });

    donation.assignedNGO = {
      ngoFirebaseUid: ngoFirebaseUid,
      ngoName: ngo.organizationName || ngo.name,
      assignedAt: new Date(),
      assignedBy: adminFirebaseUid,
      assignedRequestId: requestId || null
    };
    
    console.log('Donation assignedNGO object:', donation.assignedNGO);

    // If status is not explicitly set and NGO is assigned, set status to 'assigned'
    if (!status) {
      donation.status = 'assigned';
    }

    // Update request status to 'approved' if requestId is provided
    if (requestId) {
      const NgoRequest = require('../models/NgoRequest');
      const updatedRequest = await NgoRequest.findByIdAndUpdate(
        requestId, 
        { status: 'approved' },
        { new: true }
      );
      console.log(`Updated request ${requestId} status to approved:`, updatedRequest ? 'Success' : 'Failed');
    }
  }

  await donation.save();
  
  // Verify the save was successful
  const savedDonation = await Donation.findById(id);
  console.log('Saved donation assignedNGO:', savedDonation?.assignedNGO);
  console.log('Saved donation assignedRequestId:', savedDonation?.assignedNGO?.assignedRequestId);

  // Create donor notifications for key lifecycle events
  try {
    const donorUid = donation.donorFirebaseUid;

    const changedStatus = Boolean(status) && status !== prevStatus;
    const assignedNow = Boolean(ngoFirebaseUid) && ngoFirebaseUid !== prevNgoUid;

    // Notification when NGO is assigned (donation accepted)
    if (assignedNow) {
      await Notification.create({
        recipientFirebaseUid: donorUid,
        category: 'donations',
        title: 'Donation Accepted',
        message: `Your ${donation.resourceType} donation has been accepted and assigned to ${donation.assignedNGO?.ngoName || 'an NGO'}. Pickup will be scheduled soon.`,
        donationId: donation._id,
        redirectUrl: '/donor/dashboard',
        read: false
      });
    }

    // Notifications based on status changes
    if (changedStatus) {
      const newStatus = String(status);
      const ngoLabel = donation.assignedNGO?.ngoName || prevNgoName;

      switch (newStatus) {
        case 'cancelled':
          await Notification.create({
            recipientFirebaseUid: donorUid,
            category: 'donations',
            title: 'Donation Cancelled',
            message: `Your ${donation.resourceType} donation has been cancelled${ngoLabel ? ` by ${ngoLabel}` : ''}.${donation.cancelReason ? ` Reason: ${donation.cancelReason}` : ''} Please contact support if you have questions.`,
            donationId: donation._id,
            redirectUrl: '/donor/dashboard',
            read: false
          });
          break;

        case 'picked':
          await Notification.create({
            recipientFirebaseUid: donorUid,
            category: 'pickups',
            title: 'Pickup Completed',
            message: `Your ${donation.resourceType} donation has been successfully picked up${ngoLabel ? ` by ${ngoLabel}` : ''}. Thank you for your generous contribution!`,
            donationId: donation._id,
            redirectUrl: '/donor/dashboard',
            read: false
          });
          break;

        case 'completed':
          await Notification.create({
            recipientFirebaseUid: donorUid,
            category: 'donations',
            title: 'Donation Delivered Successfully',
            message: `Your ${donation.resourceType} donation has been successfully delivered to those in need${ngoLabel ? ` through ${ngoLabel}` : ''}. Your generosity is making a difference!`,
            donationId: donation._id,
            redirectUrl: '/donor/dashboard',
            read: false
          });
          break;

        default:
          // Generic status update for other statuses
          await Notification.create({
            recipientFirebaseUid: donorUid,
            category: newStatus === 'assigned' ? 'pickups' : 'donations',
            title: 'Donation Status Updated',
            message: `Your ${donation.resourceType} donation status is now "${newStatus}"${ngoLabel ? ` (NGO: ${ngoLabel})` : ''}.`,
            donationId: donation._id,
            redirectUrl: '/donor/dashboard',
            read: false
          });
          break;
      }
    }
  } catch (error) {
    console.error('Error creating notification:', error);
    // non-blocking
  }

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

// @desc    Get donations assigned to NGO
// @route   GET /api/v1/donations/ngo/assigned
// @access  Private (NGO)
exports.getNgoAssignedDonations = asyncHandler(async (req, res) => {
  const ngoFirebaseUid = req.firebaseUid;

  const donations = await Donation.find({
    'assignedNGO.ngoFirebaseUid': ngoFirebaseUid,
    status: { $in: ['assigned', 'volunteer_assigned', 'picked', 'completed'] }
  })
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    count: donations.length,
    data: donations
  });
});

// @desc    Assign volunteer to donation (NGO)
// @route   PUT /api/v1/donations/ngo/:id/assign-volunteer
// @access  Private (NGO)
exports.assignVolunteer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { volunteerId, volunteerName, volunteerPhone } = req.body;
  const ngoFirebaseUid = req.firebaseUid;

  const donation = await Donation.findById(id);
  if (!donation) {
    return res.status(404).json({
      success: false,
      error: 'Donation not found'
    });
  }

  // Verify that this donation is assigned to the requesting NGO
  if (donation.assignedNGO?.ngoFirebaseUid !== ngoFirebaseUid) {
    return res.status(403).json({
      success: false,
      error: 'This donation is not assigned to your NGO'
    });
  }

  // Assign volunteer
  donation.assignedVolunteer = {
    volunteerId: volunteerId || `vol_${Date.now()}`,
    volunteerName: volunteerName || 'Unknown Volunteer',
    volunteerPhone: volunteerPhone || '',
    assignedAt: new Date(),
    assignedBy: ngoFirebaseUid
  };

  // Update status to volunteer_assigned
  donation.status = 'volunteer_assigned';

  await donation.save();

  // Create announcement for admin
  try {
    await Announcement.create({
      title: 'Volunteer Assigned',
      message: `Volunteer ${volunteerName || 'Unknown'} has been assigned to donation #${donation._id.toString().substring(0, 8).toUpperCase()} by ${donation.assignedNGO?.ngoName || 'NGO'}`,
      type: 'volunteer_assigned',
      donationId: donation._id.toString(),
      ngoName: donation.assignedNGO?.ngoName || null,
      volunteerName: volunteerName || null,
      isRead: false,
      createdBy: ngoFirebaseUid
    });
  } catch (err) {
    console.error('Error creating announcement:', err);
    // Non-blocking
  }

  res.status(200).json({
    success: true,
    data: donation
  });
});

// @desc    Update donation status (NGO)
// @route   PUT /api/v1/donations/ngo/:id/status
// @access  Private (NGO)
exports.updateNgoDonationStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const ngoFirebaseUid = req.firebaseUid;

  const donation = await Donation.findById(id);
  if (!donation) {
    return res.status(404).json({
      success: false,
      error: 'Donation not found'
    });
  }

  // Verify that this donation is assigned to the requesting NGO
  if (donation.assignedNGO?.ngoFirebaseUid !== ngoFirebaseUid) {
    return res.status(403).json({
      success: false,
      error: 'This donation is not assigned to your NGO'
    });
  }

  // Validate status transition
  const validStatuses = ['volunteer_assigned', 'picked', 'completed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
    });
  }

  donation.status = status;
  await donation.save();

  res.status(200).json({
    success: true,
    data: donation
  });
});
