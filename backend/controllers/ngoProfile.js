const NgoProfile = require('../models/NgoProfile');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Get NGO profile
// @route   GET /api/v1/ngos/me
// @access  Private
const getNgoProfile = asyncHandler(async (req, res, next) => {
  const ngoProfile = await NgoProfile.findOne({ user: req.user.id })
    .populate('user', 'name email phone userType');

  if (!ngoProfile) {
    return next(new ErrorResponse('NGO profile not found', 404));
  }

  res.status(200).json({
    success: true,
    data: ngoProfile
  });
});

// @desc    Create or Update NGO profile
// @route   POST /api/v1/ngos
// @access  Private
const createOrUpdateNgoProfile = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.user = req.user.id;

  // Check if profile already exists
  let ngoProfile = await NgoProfile.findOne({ user: req.user.id });

  if (ngoProfile) {
    // Update existing profile
    ngoProfile = await NgoProfile.findByIdAndUpdate(
      ngoProfile._id,
      req.body,
      { new: true, runValidators: true }
    );
  } else {
    // Create new profile
    ngoProfile = await NgoProfile.create(req.body);
  }

  res.status(200).json({
    success: true,
    data: ngoProfile
  });
});

// @desc    Upload document for NGO
// @route   PUT /api/v1/ngos/documents
// @access  Private
const uploadDocument = asyncHandler(async (req, res, next) => {
  const { documentType, url, filename } = req.body;
  
  if (!['registrationCertificate', 'logo'].includes(documentType)) {
    return next(new ErrorResponse('Invalid document type', 400));
  }

  const updateData = {
    [`documents.${documentType}`]: {
      url,
      filename,
      uploadedAt: Date.now()
    }
  };

  const ngoProfile = await NgoProfile.findOneAndUpdate(
    { user: req.user.id },
    updateData,
    { new: true, runValidators: true }
  );

  if (!ngoProfile) {
    return next(new ErrorResponse('NGO profile not found', 404));
  }

  res.status(200).json({
    success: true,
    data: ngoProfile
  });
});

module.exports = {
  getNgoProfile,
  createOrUpdateNgoProfile,
  uploadDocument
};
