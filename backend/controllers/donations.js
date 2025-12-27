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

  const lastDonation = await Donation.findOne({ donorFirebaseUid })
    .sort({ createdAt: -1 })
    .select('createdAt')
    .lean();
  const lastDonationDate = lastDonation?.createdAt || null;

  const activeDonations = await Donation.countDocuments({
    donorFirebaseUid,
    status: { $in: ['pending', 'assigned', 'volunteer_assigned', 'picked'] }
  });

  const donationsByTypeAgg = await Donation.aggregate([
    { $match: { donorFirebaseUid } },
    {
      $group: {
        _id: '$resourceType',
        count: { $sum: 1 },
        totalQuantity: { $sum: '$quantity' }
      }
    },
    { $sort: { count: -1 } }
  ]);
  const donationsByType = (Array.isArray(donationsByTypeAgg) ? donationsByTypeAgg : []).map((r) => ({
    resourceType: r._id,
    count: Number(r.count || 0),
    totalQuantity: Number(r.totalQuantity || 0)
  }));

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
      recentDonations,
      lastDonationDate,
      activeDonations,
      donationsByType
    }
  });
});

// @desc    Verify OTP and mark donation as completed (Donor)
// @route   PUT /api/v1/donations/:id/verify-otp
// @access  Private (Firebase)
exports.verifyDonationOtp = asyncHandler(async (req, res) => {
  const donorFirebaseUid = req.firebaseUid;
  const { id } = req.params;

  const donation = await Donation.findById(id);
  if (!donation) {
    return res.status(404).json({
      success: false,
      error: 'Donation not found'
    });
  }

  if (donation.donorFirebaseUid !== donorFirebaseUid) {
    return res.status(403).json({
      success: false,
      error: 'You are not allowed to update this donation'
    });
  }

  if (donation.status !== 'picked') {
    return res.status(400).json({
      success: false,
      error: 'OTP can only be verified after pickup is marked as picked'
    });
  }

  donation.status = 'completed';
  await donation.save();

  try {
    const ngoLabel = donation.assignedNGO?.ngoName || null;
    const ngoFirebaseUid = donation.assignedNGO?.ngoFirebaseUid || null;
    await Notification.create({
      recipientFirebaseUid: donorFirebaseUid,
      category: 'donations',
      title: 'Donation Delivered Successfully',
      message: `Your ${donation.resourceType} donation has been successfully delivered to those in need${ngoLabel ? ` through ${ngoLabel}` : ''}. Your generosity is making a difference!`,
      donationId: donation._id,
      redirectUrl: '/donor/dashboard',
      read: false
    });

    if (ngoFirebaseUid) {
      await Notification.create({
        recipientFirebaseUid: ngoFirebaseUid,
        category: 'donations',
        eventType: 'donation_delivered',
        relatedType: donation.assignedNGO?.assignedRequestId ? 'request' : 'donation',
        relatedId: donation.assignedNGO?.assignedRequestId
          ? String(donation.assignedNGO.assignedRequestId)
          : donation._id.toString(),
        title: 'Donation Delivered (OTP Verified)',
        message: `Donor has verified OTP for donation #${donation._id.toString().substring(0, 8).toUpperCase()}. Delivery is completed${ngoLabel ? ` (NGO: ${ngoLabel})` : ''}.`,
        donationId: donation._id,
        redirectUrl: `/ngo/dashboard?tab=pickups-deliveries&donationId=${donation._id.toString()}`,
        read: false
      });
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

// @desc    List donor donations
// @route   GET /api/v1/donations
// @access  Private (Firebase)
exports.listMyDonations = asyncHandler(async (req, res) => {
  const donorFirebaseUid = req.firebaseUid;
  const { status, resourceType, page, limit } = req.query;

  const query = { donorFirebaseUid };
  if (status) query.status = status;
  if (resourceType) query.resourceType = resourceType;

  const pageNum = Number(page);
  const limitNum = Number(limit);

  // Backwards-compatible: if no pagination params provided, return full list
  if (!Number.isFinite(pageNum) || !Number.isFinite(limitNum) || pageNum <= 0 || limitNum <= 0) {
    const donations = await Donation.find(query).sort({ createdAt: -1 }).lean();

    return res.status(200).json({
      success: true,
      count: donations.length,
      data: donations
    });
  }

  const total = await Donation.countDocuments(query);
  const pages = Math.max(1, Math.ceil(total / limitNum));
  const safePage = Math.min(pageNum, pages);

  const donations = await Donation.find(query)
    .sort({ createdAt: -1 })
    .skip((safePage - 1) * limitNum)
    .limit(limitNum)
    .lean();

  return res.status(200).json({
    success: true,
    count: donations.length,
    total,
    page: safePage,
    pages,
    limit: limitNum,
    data: donations
  });
});

// @desc    Get all NGOs for admin
// @route   GET /api/v1/donations/admin/ngos
// @access  Private (Admin)
exports.getAllNGOs = asyncHandler(async (req, res) => {
  const NgoRegistration = require('../models/NgoRegistration');
  
  // Get all NGOs with approved registrations OR isVerified: true
  // First, get all approved NGO registrations
  const approvedRegistrations = await NgoRegistration.find({ status: 'approved' })
    .select('firebaseUid ngoName')
    .lean();
  
  const approvedFirebaseUids = approvedRegistrations.map(reg => reg.firebaseUid);
  
  // Get all NGOs that are either:
  // 1. Verified in User model (isVerified: true), OR
  // 2. Have approved registration status
  const ngos = await User.find({
    userType: 'ngo',
    $or: [
      { isVerified: true },
      { firebaseUid: { $in: approvedFirebaseUids } }
    ]
  })
    .select('_id name email organizationName firebaseUid isVerified')
    .lean();

  // Enrich with registration data (use ngoName from registration if available)
  const ngosWithRegistrationData = ngos.map(ngo => {
    const registration = approvedRegistrations.find(reg => reg.firebaseUid === ngo.firebaseUid);
    return {
      ...ngo,
      organizationName: ngo.organizationName || registration?.ngoName || ngo.name || 'Unknown NGO'
    };
  });

  console.log(`Found ${ngosWithRegistrationData.length} NGOs (${ngos.filter(n => n.isVerified).length} verified, ${approvedFirebaseUids.length} with approved registration)`);

  res.status(200).json({
    success: true,
    count: ngosWithRegistrationData.length,
    data: ngosWithRegistrationData
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

  // Prevent status changes if donation is already assigned to an NGO
  if (donation.assignedNGO?.ngoFirebaseUid && status && status !== donation.status) {
    return res.status(400).json({
      success: false,
      error: 'Cannot change status of an assigned donation'
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

      // NGO notification when donation is assigned to them
      await Notification.create({
        recipientFirebaseUid: donation.assignedNGO?.ngoFirebaseUid,
        category: 'donations',
        eventType: 'donation_assigned',
        relatedType: requestId ? 'request' : 'donation',
        relatedId: requestId ? String(requestId) : donation._id.toString(),
        title: 'New Donation Assigned',
        message: `A ${donation.resourceType} donation has been assigned to your NGO. Please proceed with volunteer assignment and pickup scheduling.`,
        donationId: donation._id,
        redirectUrl: `/ngo/dashboard?tab=pickups-deliveries&donationId=${donation._id.toString()}${requestId ? `&requestId=${String(requestId)}` : ''}`,
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

    // NGO notification for admin-driven status changes (if assigned)
    if (changedStatus && donation.assignedNGO?.ngoFirebaseUid) {
      const ngoUid = donation.assignedNGO.ngoFirebaseUid;
      const ngoLabel = donation.assignedNGO?.ngoName || null;
      const requestIdForTracking = donation.assignedNGO?.assignedRequestId || requestId || null;

      await Notification.create({
        recipientFirebaseUid: ngoUid,
        category: newStatus === 'picked' ? 'pickups' : 'donations',
        eventType: 'donation_status_changed',
        relatedType: requestIdForTracking ? 'request' : 'donation',
        relatedId: requestIdForTracking ? String(requestIdForTracking) : donation._id.toString(),
        title: 'Donation Status Updated',
        message: `Donation #${donation._id.toString().substring(0, 8).toUpperCase()} status is now "${newStatus}"${ngoLabel ? ` (NGO: ${ngoLabel})` : ''}.`,
        donationId: donation._id,
        redirectUrl: `/ngo/dashboard?tab=pickups-deliveries&donationId=${donation._id.toString()}${requestIdForTracking ? `&requestId=${String(requestIdForTracking)}` : ''}`,
        read: false
      });
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
  const startTime = Date.now();
  const { status, resourceType, city, startDate, endDate, page = 1, limit = 50 } = req.query;

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

  // Limit to last 90 days by default for performance
  if (!startDate && !endDate) {
    query.createdAt = { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) };
  }

  // Pagination
  const skip = (Number(page) - 1) * Number(limit);
  const limitNum = Math.min(Number(limit), 100); // Max 100 records per request

  console.log('Fetching donations with query:', query);

  // Fetch donations with pagination and timeout
  const [donations, totalCount] = await Promise.all([
    Donation.find(query)
      .select('donorFirebaseUid resourceType quantity unit address pickup status createdAt details')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean()
      .maxTimeMS(10000), // 10 second timeout
    Donation.countDocuments(query).maxTimeMS(5000) // 5 second timeout
  ]);

  console.log(`Found ${donations.length} donations out of ${totalCount} total`);

  if (donations.length === 0) {
    return res.status(200).json({
      success: true,
      count: 0,
      totalCount: 0,
      page: Number(page),
      pages: 0,
      data: []
    });
  }

  // Get unique donor Firebase UIDs
  const donorFirebaseUids = [...new Set(donations.map(d => d.donorFirebaseUid).filter(Boolean))];
  
  // Fetch all donor information in parallel
  const [users, profiles] = await Promise.all([
    User.find({ firebaseUid: { $in: donorFirebaseUids } })
      .select('firebaseUid name email phone')
      .lean()
      .maxTimeMS(5000),
    Profile.find({ firebaseUid: { $in: donorFirebaseUids } })
      .select('firebaseUid basic.name basic.email basic.phone')
      .lean()
      .maxTimeMS(5000)
  ]);

  // Create maps for quick lookup
  const userMap = new Map(users.map(u => [u.firebaseUid, u]));
  const profileMap = new Map(profiles.map(p => [p.firebaseUid, p]));

  // Combine donation data with donor information
  const donationsWithDonorInfo = donations.map(donation => {
    const user = userMap.get(donation.donorFirebaseUid);
    const profile = profileMap.get(donation.donorFirebaseUid);
    
    let donorName = 'Unknown Donor';
    let donorEmail = '';
    let donorPhone = '';

    if (user) {
      donorName = user.name || donorName;
      donorEmail = user.email || donorEmail;
      donorPhone = user.phone || donorPhone;
    } else if (profile && profile.basic) {
      donorName = profile.basic.name || donorName;
      donorEmail = profile.basic.email || donorEmail;
      donorPhone = profile.basic.phone || donorPhone;
    }

    return {
      ...donation,
      donorName,
      donorEmail,
      donorPhone
    };
  });

  const totalPages = Math.ceil(totalCount / limitNum);
  console.log(`Processed ${donationsWithDonorInfo.length} donations in ${Date.now() - startTime}ms`);

  res.status(200).json({
    success: true,
    count: donationsWithDonorInfo.length,
    totalCount,
    page: Number(page),
    pages: totalPages,
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

exports.getNgoLiveDonationsPool = asyncHandler(async (req, res) => {
  const firebaseUid = req.firebaseUid;

  const ngoUser = await User.findOne({ firebaseUid, userType: 'ngo' }).select('_id').lean();
  if (!ngoUser) {
    return res.status(403).json({
      success: false,
      error: 'Not authorized. NGO access required.'
    });
  }

  const take = Math.min(Math.max(Number(req.query.limit || 8), 1), 50);

  const query = {
    status: 'pending',
    'assignedNGO.ngoFirebaseUid': null
  };

  const [count, donations] = await Promise.all([
    Donation.countDocuments(query),
    Donation.find(query)
      .select('resourceType quantity unit address pickup status createdAt')
      .sort({ createdAt: -1 })
      .limit(take)
      .lean()
  ]);

  res.status(200).json({
    success: true,
    count,
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
  const { status, otp } = req.body;
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

  const prevStatus = donation.status;
  donation.status = status;
  await donation.save();

  // Donor notification when OTP is sent (picked)
  try {
    const changedStatus = status !== prevStatus;
    if (changedStatus && status === 'picked') {
      const ngoLabel = donation.assignedNGO?.ngoName || null;
      const otpLabel = otp ? ` OTP: ${String(otp)}.` : '';
      await Notification.create({
        recipientFirebaseUid: donation.donorFirebaseUid,
        category: 'pickups',
        title: 'OTP Sent for Verification',
        message: `OTP has been sent for your donation #${donation._id.toString().substring(0, 8).toUpperCase()}.${otpLabel} Please verify it to confirm receipt${ngoLabel ? ` (NGO: ${ngoLabel})` : ''}.`,
        donationId: donation._id,
        redirectUrl: `/donor/dashboard?tab=notifications&filter=pickups&donationId=${donation._id.toString()}`,
        read: false
      });
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
