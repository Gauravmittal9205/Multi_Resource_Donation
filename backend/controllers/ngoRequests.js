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
        approvedRequests,
        fulfilledRequests,
        rejectedRequests
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
    const ngo = await User.findOne({ firebaseUid: request.ngoFirebaseUid });
    const ngoName = ngo?.organizationName || ngo?.name || 'NGO';
    
    const notificationType = status === 'approved' ? 'request_approved' : 'request_rejected';
    const title = status === 'approved' 
      ? 'Request Approved' 
      : 'Request Rejected';
    const message = status === 'approved'
      ? `Your request "${request.requestTitle}" has been approved by the admin.`
      : `Your request "${request.requestTitle}" has been rejected by the admin.`;

    await Notification.create({
      ngoFirebaseUid: request.ngoFirebaseUid,
      type: notificationType,
      title,
      message,
      relatedId: request._id.toString(),
      relatedType: 'request'
    });
  }

  res.status(200).json({
    success: true,
    data: request
  });
});

