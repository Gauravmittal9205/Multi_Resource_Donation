const NgoRequest = require('../models/NgoRequest');
const User = require('../models/User');
const NgoRegistration = require('../models/NgoRegistration');
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
  console.log('=== Starting getNgosWithActiveRequests ===');
  
  try {
    console.log('1. Starting to fetch requests...');
    
    // First, get all pending requests (exclude approved/fulfilled/cancelled/rejected)
    // Note: We'll also filter out requests that are assigned to donations
    const allRequests = await NgoRequest.find({ 
      status: { $in: ['pending'] }  // Only get pending requests
    }).lean();
    console.log(`2. Found ${allRequests.length} pending requests`);
    
    // Also get approved requests to check if they're assigned
    const approvedRequests = await NgoRequest.find({ 
      status: 'approved' 
    }).lean();
    console.log(`2.1. Found ${approvedRequests.length} approved requests`);
    
    if (allRequests.length === 0) {
      console.log('No pending requests found');
      return res.status(200).json({
        success: true,
        count: 0,
        data: []
      });
    }
    
    // Get all assigned request IDs from donations
    const Donation = require('../models/Donation');
    const mongoose = require('mongoose');
    
    // Query for donations that have assignedRequestId
    const assignedDonations = await Donation.find({
      'assignedNGO.assignedRequestId': { $exists: true, $ne: null, $ne: '' }
    }).select('assignedNGO _id').lean();
    
    console.log(`2.4. Found ${assignedDonations.length} donations with assigned requests`);
    
    // Log all assigned donations for debugging
    assignedDonations.forEach((d, idx) => {
      console.log(`  Donation ${idx + 1}: ID=${d._id}, assignedRequestId=${d.assignedNGO?.assignedRequestId}, type=${typeof d.assignedNGO?.assignedRequestId}`);
    });
    
    // Create a set of assigned request IDs (handle both ObjectId and string)
    const assignedRequestIds = new Set();
    const assignedRequestIdsAsObjectIds = [];
    
    assignedDonations.forEach(d => {
      const requestId = d.assignedNGO?.assignedRequestId;
      if (requestId) {
        // Convert to string for consistent comparison
        const idStr = String(requestId).trim();
        if (idStr && idStr !== 'null' && idStr !== 'undefined') {
          assignedRequestIds.add(idStr);
          console.log(`  Added assigned request ID: ${idStr} (from donation ${d._id})`);
          
          // Also try to convert to ObjectId if it's a valid ObjectId string
          if (mongoose.Types.ObjectId.isValid(idStr)) {
            try {
              const objId = new mongoose.Types.ObjectId(idStr);
              assignedRequestIdsAsObjectIds.push(objId);
              console.log(`  Added assigned request ObjectId: ${objId} (from donation ${d._id})`);
            } catch (e) {
              console.error(`Error converting ${idStr} to ObjectId:`, e);
            }
          } else {
            console.log(`  Warning: ${idStr} is not a valid ObjectId`);
          }
        } else {
          console.log(`  Warning: Invalid requestId from donation ${d._id}: ${idStr}`);
        }
      } else {
        console.log(`  Warning: No requestId found in donation ${d._id}`);
      }
    });
    
    console.log(`2.5. Found ${assignedRequestIds.size} unique assigned request IDs`);
    console.log('Assigned request IDs (strings):', Array.from(assignedRequestIds));
    
    // Combine pending and approved requests for filtering
    const allRequestsToCheck = [...allRequests, ...approvedRequests];
    console.log(`2.5.1. Total requests to check: ${allRequestsToCheck.length} (${allRequests.length} pending + ${approvedRequests.length} approved)`);
    
    // Filter out already assigned requests - check both string and ObjectId comparison
    const availableRequests = allRequests.filter(request => {
      const requestIdStr = String(request._id).trim();
      const requestIdObj = request._id;
      
      // Check if this request ID is in the assigned set (as string)
      const isAssignedAsString = assignedRequestIds.has(requestIdStr);
      
      // Check if this request ID is in the assigned set (as ObjectId)
      let isAssignedAsObjectId = false;
      if (mongoose.Types.ObjectId.isValid(requestIdStr)) {
        try {
          const requestObjId = new mongoose.Types.ObjectId(requestIdStr);
          isAssignedAsObjectId = assignedRequestIdsAsObjectIds.some(
            objId => objId.equals(requestObjId)
          );
        } catch (e) {
          // Ignore conversion errors
        }
      }
      
      const isAssigned = isAssignedAsString || isAssignedAsObjectId;
      
      // Also check if request status is 'approved' (should be excluded)
      const isApproved = request.status === 'approved';
      
      if (isAssigned || isApproved) {
        const matchType = isAssignedAsString ? 'string' : isAssignedAsObjectId ? 'ObjectId' : 'status';
        console.log(`[FILTER] Removing request: ${requestIdStr} (assigned: ${isAssigned}, approved: ${isApproved}, match: ${matchType})`);
        if (isAssigned) {
          console.log(`  - Request ${requestIdStr} found in assigned set: ${Array.from(assignedRequestIds).includes(requestIdStr)}`);
        }
        return false;
      }
      
      return true;
    });
    
    console.log(`2.6. ${availableRequests.length} requests available after filtering`);
    
    // Log which requests were kept
    if (availableRequests.length > 0) {
      console.log('Available request IDs:', availableRequests.slice(0, 5).map(r => r._id.toString()));
    }
    
    if (availableRequests.length === 0) {
      console.log('No available requests found after filtering');
      return res.status(200).json({
        success: true,
        count: 0,
        data: []
      });
    }
    
    console.log('3. Fetching NGO details...');
    
    // Get unique NGO Firebase UIDs
    const ngoFirebaseUids = [...new Set(availableRequests.map(r => r.ngoFirebaseUid).filter(Boolean))];
    console.log(`4. Found ${ngoFirebaseUids.length} unique NGO UIDs`);
    
    // Get NGO details
    const ngoDetails = await NgoRegistration.find({
      firebaseUid: { $in: ngoFirebaseUids }
    }).lean();
    
    console.log(`5. Found details for ${ngoDetails.length} NGOs`);
    
    // Create a map of NGO details by Firebase UID
    const ngoMap = new Map(ngoDetails.map(ngo => [ngo.firebaseUid, ngo]));
    
    // Group requests by NGO
    const ngosWithRequests = [];
    const requestsByNgo = new Map();
    
    availableRequests.forEach(request => {
      if (!request.ngoFirebaseUid) return;
      
      if (!requestsByNgo.has(request.ngoFirebaseUid)) {
        requestsByNgo.set(request.ngoFirebaseUid, []);
      }
      requestsByNgo.get(request.ngoFirebaseUid).push(request);
    });
    
    console.log(`6. Grouped into ${requestsByNgo.size} NGOs`);
    
    // Prepare the response
    requestsByNgo.forEach((requests, ngoFirebaseUid) => {
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
      
      ngosWithRequests.push({
        _id: ngo._id || ngoFirebaseUid,
        firebaseUid: ngoFirebaseUid, // Add firebaseUid to response
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
      });
    });
    
    console.log(`7. Prepared response with ${ngosWithRequests.length} NGOs`);
    
    res.status(200).json({
      success: true,
      count: ngosWithRequests.length,
      data: ngosWithRequests
    });
    
  } catch (error) {
    console.error('CRITICAL ERROR in getNgosWithActiveRequests:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      keyPattern: error.keyPattern,
      keyValue: error.keyValue
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch NGO requests',
      details: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack,
        code: error.code
      } : undefined
    });
  } finally {
    console.log('=== Completed getNgosWithActiveRequests ===');
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
  const { status, category, urgencyLevel, page = 1, limit = 50 } = req.query;

  const query = {};
  if (status) query.status = status;
  if (category) query.category = category;
  if (urgencyLevel) query.urgencyLevel = urgencyLevel;

  const skip = (page - 1) * limit;
  const limitNum = parseInt(limit) > 100 ? 100 : parseInt(limit);

  // Use aggregation pipeline for better performance
  const requests = await NgoRequest.aggregate([
    { $match: query },
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limitNum },
    {
      $lookup: {
        from: 'users',
        localField: 'ngoFirebaseUid',
        foreignField: 'firebaseUid',
        as: 'ngo',
        pipeline: [
          { $match: { userType: 'ngo' } },
          { $project: { firebaseUid: 1, name: 1, organizationName: 1 } }
        ]
      }
    },
    {
      $addFields: {
        ngoName: {
          $ifNull: [
            { $arrayElemAt: ['$ngo.organizationName', 0] },
            { $arrayElemAt: ['$ngo.name', 0] },
            'NGO'
          ]
        }
      }
    },
    {
      $project: {
        ngo: 0
      }
    }
  ]);

  // Get total count for pagination
  const totalCount = await NgoRequest.countDocuments(query);

  res.status(200).json({
    success: true,
    count: requests.length,
    totalCount,
    currentPage: parseInt(page),
    totalPages: Math.ceil(totalCount / limitNum),
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

