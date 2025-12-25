const NgoRequest = require('../models/NgoRequest');
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
        fulfilledRequests
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

  const requests = await NgoRequest.find(query)
    .sort({ createdAt: -1 })
    .lean();

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

  res.status(200).json({
    success: true,
    data: request
  });
});

