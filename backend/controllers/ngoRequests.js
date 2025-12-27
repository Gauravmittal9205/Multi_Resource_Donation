const NgoRequest = require('../models/NgoRequest');
const User = require('../models/User');
const NgoRegistration = require('../models/NgoRegistration');
const Donation = require('../models/Donation');
const Notification = require('../models/Notification');
const asyncHandler = require('../middleware/async');

// @desc    Create NGO request
// @route   POST /api/v1/ngo-requests
// @access  Private (Firebase)
exports.createNgoRequest = asyncHandler(async (req, res) => {
  const ngoFirebaseUid = req.firebaseUid;

  const {
    requestTitle,
    category,
    quantity,
    urgencyLevel,
    description,
    neededBy,
    images,
    // Food category fields
    foodType,
    foodCategory,
    approxWeight,
    expiryTime,
    // Clothing category fields
    clothingType,
    condition,
    season,
    // Medical category fields
    medicalType,
    expiryDate,
    storageRequirements,
    // Education category fields
    bookType,
    subject,
    ageGroup,
    // Other category fields
    itemType,
    specifications
  } = req.body;

  const ngoRequest = await NgoRequest.create({
    ngoFirebaseUid,
    requestTitle,
    category,
    quantity: Number(quantity),
    urgencyLevel,
    description,
    neededBy: neededBy ? new Date(neededBy) : null,
    images: Array.isArray(images) ? images : [],
    status: 'pending',
    // Food category fields
    foodType: foodType || '',
    foodCategory: foodCategory || '',
    approxWeight: approxWeight ? Number(approxWeight) : null,
    expiryTime: expiryTime ? new Date(expiryTime) : null,
    // Clothing category fields
    clothingType: clothingType || '',
    condition: condition || '',
    season: season || '',
    // Medical category fields
    medicalType: medicalType || '',
    expiryDate: expiryDate ? new Date(expiryDate) : null,
    storageRequirements: storageRequirements || '',
    // Education category fields
    bookType: bookType || '',
    subject: subject || '',
    ageGroup: ageGroup || '',
    // Other category fields
    itemType: itemType || '',
    specifications: specifications || ''
  });

  res.status(201).json({
    success: true,
    data: ngoRequest
  });
});

// @desc    Get all requests for logged in NGO
// @route   GET /api/v1/ngo-requests
// @access  Private (Firebase)
exports.getMyRequests = asyncHandler(async (req, res) => {
  const ngoFirebaseUid = req.firebaseUid;
  const { status } = req.query;

  const query = { ngoFirebaseUid };
  if (status) query.status = status;

  const requests = await NgoRequest.find(query)
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    count: requests.length,
    data: requests
  });
});

// @desc    Get single request by ID (Admin)
// @route   GET /api/v1/ngo-requests/admin/:id
// @access  Private (Admin)
exports.getRequestAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const request = await NgoRequest.findById(id);

  if (!request) {
    return res.status(404).json({
      success: false,
      error: 'Request not found'
    });
  }

  res.status(200).json({
    success: true,
    data: request
  });
});

// @desc    Get single request by ID
// @route   GET /api/v1/ngo-requests/:id
// @access  Private (Firebase)
exports.getRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const ngoFirebaseUid = req.firebaseUid;

  const request = await NgoRequest.findOne({
    _id: id,
    ngoFirebaseUid
  });

  if (!request) {
    return res.status(404).json({
      success: false,
      error: 'Request not found'
    });
  }

  res.status(200).json({
    success: true,
    data: request
  });
});

// @desc    Update NGO request
// @route   PUT /api/v1/ngo-requests/:id
// @access  Private (Firebase)
exports.updateRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const ngoFirebaseUid = req.firebaseUid;

  const {
    requestTitle,
    category,
    quantity,
    urgencyLevel,
    description,
    neededBy,
    images,
    status
  } = req.body;

  let request = await NgoRequest.findOne({
    _id: id,
    ngoFirebaseUid
  });

  if (!request) {
    return res.status(404).json({
      success: false,
      error: 'Request not found'
    });
  }

  // Update fields
  if (requestTitle) request.requestTitle = requestTitle;
  if (category) request.category = category;
  if (quantity) request.quantity = Number(quantity);
  if (urgencyLevel) request.urgencyLevel = urgencyLevel;
  if (description) request.description = description;
  if (neededBy !== undefined) request.neededBy = neededBy ? new Date(neededBy) : null;
  if (images !== undefined) request.images = Array.isArray(images) ? images : [];
  if (status) request.status = status;

  await request.save();

  res.status(200).json({
    success: true,
    data: request
  });
});

// @desc    Delete NGO request
// @route   DELETE /api/v1/ngo-requests/:id
// @access  Private (Firebase)
exports.deleteRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const ngoFirebaseUid = req.firebaseUid;

  const request = await NgoRequest.findOneAndDelete({
    _id: id,
    ngoFirebaseUid
  });

  if (!request) {
    return res.status(404).json({
      success: false,
      error: 'Request not found'
    });
  }

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get NGO dashboard summary
// @route   GET /api/v1/ngo-requests/dashboard
// @access  Private (Firebase)
// @desc    Get NGOs with their active donation requests
// @route   GET /api/v1/ngo-requests/active
// @access  Private (Admin)
exports.getNgosWithActiveRequests = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  console.log('=== Starting getNgosWithActiveRequests ===');
  
  try {
    console.log('1. Starting to fetch requests...');
    
    // 1. Run all database queries in parallel
    const [allRequests, approvedRequests, assignedDonations] = await Promise.all([
      // Get pending requests from last 30 days
      NgoRequest.find({ 
        status: { $in: ['pending'] },
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      })
      .select('_id ngoFirebaseUid requestTitle category quantity urgencyLevel description status neededBy createdAt')
      .sort({ createdAt: -1 })
      .lean()
      .maxTimeMS(10000), // 10 second timeout
      
      // Get approved requests from last 7 days
      NgoRequest.find({ 
        status: 'approved',
        updatedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      })
      .select('_id status')
      .lean(),
      
      // Get assigned donations
      Donation.find({
        'assignedNGO.assignedRequestId': { $exists: true, $ne: null }
      })
      .select('assignedNGO.assignedRequestId')
      .lean()
      .maxTimeMS(5000) // 5 second timeout
    ]);

    console.log(`2. Queries completed in ${Date.now() - startTime}ms`);
    console.log(`- Found ${allRequests.length} pending requests`);
    console.log(`- Found ${approvedRequests.length} approved requests`);
    console.log(`- Found ${assignedDonations.length} assigned donations`);

    if (allRequests.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: []
      });
    }

    // 2. Create sets for O(1) lookups
    const assignedRequestIds = new Set(
      assignedDonations
        .map(d => d.assignedNGO?.assignedRequestId?.toString())
        .filter(Boolean)
    );

    const approvedRequestIds = new Set(
      approvedRequests.map(r => r._id.toString())
    );

    // 3. Filter out assigned and approved requests
    const availableRequests = allRequests.filter(request => {
      const requestId = request._id.toString();
      return !assignedRequestIds.has(requestId) && !approvedRequestIds.has(requestId);
    });

    console.log(`3. ${availableRequests.length} requests available after filtering`);

    if (availableRequests.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: []
      });
    }

    // 4. Get unique NGO Firebase UIDs
    const ngoFirebaseUids = [...new Set(availableRequests.map(r => r.ngoFirebaseUid).filter(Boolean))];
    
    // 5. Get NGO details with only necessary fields
    const ngoDetails = await NgoRegistration.find(
      { firebaseUid: { $in: ngoFirebaseUids } },
      'firebaseUid ngoName email phone city state pincode address organizationType registrationNumber'
    )
    .lean()
    .maxTimeMS(5000); // 5 second timeout

    console.log(`4. Fetched details for ${ngoDetails.length} NGOs`);

    // 6. Create a map of NGO details by Firebase UID
    const ngoMap = new Map(ngoDetails.map(ngo => [ngo.firebaseUid, ngo]));

    // 7. Group requests by NGO
    const requestsByNgo = new Map();
    availableRequests.forEach(request => {
      if (!request.ngoFirebaseUid) return;
      
      if (!requestsByNgo.has(request.ngoFirebaseUid)) {
        requestsByNgo.set(request.ngoFirebaseUid, []);
      }
      requestsByNgo.get(request.ngoFirebaseUid).push(request);
    });

    // 8. Prepare the response
    const ngosWithRequests = Array.from(requestsByNgo.entries()).map(([ngoFirebaseUid, requests]) => {
      const ngo = ngoMap.get(ngoFirebaseUid) || {
        ngoName: 'Unknown NGO',
        email: '',
        phone: '',
        city: '',
        state: '',
        pincode: '',
        address: '',
        organizationType: '',
        registrationNumber: ''
      };
      
      return {
        _id: ngo._id || ngoFirebaseUid,
        firebaseUid: ngoFirebaseUid,
        ngoName: ngo.ngoName,
        email: ngo.email,
        phone: ngo.phone,
        location: {
          city: ngo.city,
          state: ngo.state,
          pincode: ngo.pincode,
          address: ngo.address
        },
        organizationType: ngo.organizationType,
        registrationNumber: ngo.registrationNumber,
        requests: requests.map(r => ({
          _id: r._id,
          requestTitle: r.requestTitle,
          category: r.category,
          quantity: r.quantity,
          urgencyLevel: r.urgencyLevel,
          description: r.description,
          status: r.status,
          neededBy: r.neededBy,
          createdAt: r.createdAt
        }))
      };
    });

    console.log(`5. Prepared response with ${ngosWithRequests.length} NGOs in ${Date.now() - startTime}ms`);

    res.status(200).json({
      success: true,
      count: ngosWithRequests.length,
      data: ngosWithRequests
    });
    
  } catch (error) {
    console.error('Error in getNgosWithActiveRequests:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch NGO requests',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Get NGO dashboard data
exports.getNgoDashboard = asyncHandler(async (req, res) => {
  const ngoFirebaseUid = req.firebaseUid;
  const Donation = require('../models/Donation');

  const totalRequests = await NgoRequest.countDocuments({ ngoFirebaseUid });
  const pendingRequests = await NgoRequest.countDocuments({
    ngoFirebaseUid,
    status: 'pending'
  });
  const approvedRequests = await NgoRequest.countDocuments({
    ngoFirebaseUid,
    status: 'approved'
  });
  const fulfilledRequests = await NgoRequest.countDocuments({
    ngoFirebaseUid,
    status: 'fulfilled'
  });
  const rejectedRequests = await NgoRequest.countDocuments({
    ngoFirebaseUid,
    status: 'rejected'
  });

  // Count assigned requests (requests that have donations assigned to them)
  const assignedDonations = await Donation.find({
    'assignedNGO.ngoFirebaseUid': ngoFirebaseUid,
    'assignedNGO.assignedRequestId': { $exists: true, $ne: null }
  }).select('assignedNGO.assignedRequestId').lean();
  
  const assignedRequestIds = [...new Set(assignedDonations.map(d => d.assignedNGO?.assignedRequestId).filter(Boolean))];
  const assignedRequestsCount = assignedRequestIds.length;

  // Get donation statistics
  const totalDonations = await Donation.countDocuments({
    'assignedNGO.ngoFirebaseUid': ngoFirebaseUid
  });
  
  const donationsByStatus = await Donation.aggregate([
    {
      $match: { 'assignedNGO.ngoFirebaseUid': ngoFirebaseUid }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const volunteerAssignedCount = await Donation.countDocuments({
    'assignedNGO.ngoFirebaseUid': ngoFirebaseUid,
    status: 'volunteer_assigned'
  });

  const pickedUpCount = await Donation.countDocuments({
    'assignedNGO.ngoFirebaseUid': ngoFirebaseUid,
    status: 'picked'
  });

  const completedCount = await Donation.countDocuments({
    'assignedNGO.ngoFirebaseUid': ngoFirebaseUid,
    status: 'completed'
  });

  // Get donations by resource type
  const donationsByType = await Donation.aggregate([
    {
      $match: { 'assignedNGO.ngoFirebaseUid': ngoFirebaseUid }
    },
    {
      $group: {
        _id: '$resourceType',
        count: { $sum: 1 },
        totalQuantity: { $sum: '$quantity' }
      }
    }
  ]);

  // Get requests over time (last 12 months)
  const now = new Date();
  const months = [];
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      year: date.getFullYear(),
      month: date.getMonth(),
      label: date.toLocaleString('en-US', { month: 'short' }),
      start: new Date(date.getFullYear(), date.getMonth(), 1),
      end: new Date(date.getFullYear(), date.getMonth() + 1, 1)
    });
  }

  const requestsOverTime = await Promise.all(
    months.map(async (m) => {
      const count = await NgoRequest.countDocuments({
        ngoFirebaseUid,
        createdAt: { $gte: m.start, $lt: m.end }
      });
      return { label: m.label, count };
    })
  );

  // Get donations over time (last 12 months)
  const donationsOverTime = await Promise.all(
    months.map(async (m) => {
      const count = await Donation.countDocuments({
        'assignedNGO.ngoFirebaseUid': ngoFirebaseUid,
        createdAt: { $gte: m.start, $lt: m.end }
      });
      return { label: m.label, count };
    })
  );

  const urgentRequests = await NgoRequest.find({
    ngoFirebaseUid,
    urgencyLevel: 'high',
    status: { $in: ['pending', 'approved'] }
  })
    .sort({ neededBy: 1 })
    .limit(5)
    .lean();

  res.status(200).json({
    success: true,
    data: {
      summary: {
        totalRequests,
        pendingRequests,
        assignedRequests: assignedRequestsCount,
        approvedRequests,
        fulfilledRequests,
        rejectedRequests,
        totalDonations,
        volunteerAssignedCount,
        pickedUpCount,
        completedCount
      },
      analytics: {
        donationsByStatus: donationsByStatus.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        donationsByType: donationsByType.map(item => ({
          type: item._id,
          count: item.count,
          totalQuantity: item.totalQuantity
        })),
        requestsOverTime,
        donationsOverTime
      },
      urgentRequests
    }
  });
});

// @desc    Get all requests (Admin)
// @route   GET /api/v1/ngo-requests/admin/all
// @access  Private (Admin)
exports.getAllRequests = asyncHandler(async (req, res) => {
  const { status, category, urgencyLevel } = req.query;

  const query = {};
  if (status) query.status = status;
  if (category) query.category = category;
  if (urgencyLevel) query.urgencyLevel = urgencyLevel;

  // First get all the requests
  let requests = await NgoRequest.find(query)
    .sort({ createdAt: -1 })
    .lean();

  // Get all unique NGO Firebase UIDs
  const ngoFirebaseUids = [...new Set(requests.map(r => r.ngoFirebaseUid))];
  
  // Get NGO details in one query
  const ngos = await User.find({ 
    firebaseUid: { $in: ngoFirebaseUids },
    userType: 'ngo'  // Only get NGO users
  })
  .select('firebaseUid name organizationName')
  .lean();
  
  // Create a map for quick lookup
  const ngoMap = {};
  ngos.forEach(ngo => {
    // Log the ngo object for debugging
    console.log('NGO data:', ngo);
    // Use organizationName if available, otherwise fall back to name
    ngoMap[ngo.firebaseUid] = ngo.organizationName || ngo.name || 'NGO';
  });
  
  // Add NGO name to each request
  requests = requests.map(request => ({
    ...request,
    ngoName: ngoMap[request.ngoFirebaseUid] || 'NGO'
  }));

  res.status(200).json({
    success: true,
    count: requests.length,
    data: requests
  });
});

// @desc    Update request status (Admin)
// @route   PUT /api/v1/ngo-requests/admin/:id
// @access  Private (Admin)
exports.updateRequestStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const request = await NgoRequest.findById(id);

  if (!request) {
    return res.status(404).json({
      success: false,
      error: 'Request not found'
    });
  }

  request.status = status;
  await request.save();

  // Create notification for NGO
  if (status === 'approved' || status === 'rejected') {
    const title = status === 'approved' ? 'Request Approved' : 'Request Rejected';
    const message =
      status === 'approved'
        ? `Your request "${request.requestTitle}" has been approved by the admin.`
        : `Your request "${request.requestTitle}" has been rejected by the admin.`;

    try {
      await Notification.create({
        recipientFirebaseUid: request.ngoFirebaseUid,
        category: 'system',
        title,
        message,
        redirectUrl: `/ngo/dashboard?tab=my-requests&requestId=${request._id.toString()}`,
        read: false
      });
    } catch (error) {
      console.error('Error creating NGO request status notification:', error);
      // non-blocking
    }
  }

  res.status(200).json({
    success: true,
    data: request
  });
});

