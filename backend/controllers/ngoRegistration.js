const NgoRegistration = require('../models/NgoRegistration');
const User = require('../models/User');
const Notification = require('../models/Notification');
const asyncHandler = require('../middleware/async');

// Function to generate a random 12-digit number as string
const generateRegistrationNumber = () => {
  const min = 100000000000; // 12-digit number starting with 1
  const max = 999999999999; // 12-digit number
  const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
  return randomNum.toString();
};

// @desc    Create NGO registration
// @route   POST /api/v1/ngo-registration
// @access  Private (Firebase)
exports.createNgoRegistration = asyncHandler(async (req, res) => {
  const firebaseUid = req.firebaseUid;

  // Check if user already has a registration
  const existingRegistration = await NgoRegistration.findOne({ firebaseUid });
  if (existingRegistration) {
    return res.status(400).json({
      success: false,
      error: 'You have already submitted a registration. Please wait for verification.'
    });
  }

  // Generate a unique 12-digit registration number
  let registrationNumber;
  let isUnique = false;
  
  // Keep generating until we get a unique number (should be first try in most cases)
  while (!isUnique) {
    registrationNumber = generateRegistrationNumber();
    const existing = await NgoRegistration.findOne({ registrationNumber });
    if (!existing) {
      isUnique = true;
    }
  }

  const {
    organizationType,
    ngoName,
    contactPerson,
    phone,
    city,
    state,
    pincode,
    pickupDeliveryPreference,
    aadhaarNumber,
    aadhaarCard,
    alternateIdType,
    alternateIdFile,
    ngoCertificate,
    addressProof,
    declarationAccepted,
    verificationConsent
  } = req.body;

  // Validate required fields
  if (!declarationAccepted || !verificationConsent) {
    return res.status(400).json({
      success: false,
      error: 'Declaration and verification consent are required'
    });
  }

  const registration = await NgoRegistration.create({
    firebaseUid,
    organizationType,
    ngoName,
    contactPerson,
    phone,
    city,
    state,
    pincode,
    pickupDeliveryPreference,
    aadhaarNumber,
    aadhaarCard: aadhaarCard || '',
    alternateIdType: alternateIdType || '',
    alternateIdFile: alternateIdFile || '',
    registrationNumber,
    ngoCertificate,
    addressProof,
    declarationAccepted,
    verificationConsent,
    status: 'pending'
  });

  res.status(201).json({
    success: true,
    message: 'Registration submitted successfully. Your application is under review.',
    data: registration
  });
});

// @desc    Get my registration status
// @route   GET /api/v1/ngo-registration
// @access  Private (Firebase)
exports.getMyRegistration = asyncHandler(async (req, res) => {
  const firebaseUid = req.firebaseUid;

  const registration = await NgoRegistration.findOne({ firebaseUid });

  if (!registration) {
    return res.status(404).json({
      success: false,
      error: 'No registration found'
    });
  }

  res.status(200).json({
    success: true,
    data: registration
  });
});

// @desc    Get all registrations (Admin)
// @route   GET /api/v1/ngo-registration/admin/all
// @access  Private (Admin)
exports.getAllRegistrations = asyncHandler(async (req, res) => {
  const { status } = req.query;

  const query = {};
  if (status) query.status = status;

  const registrations = await NgoRegistration.find(query)
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    count: registrations.length,
    data: registrations
  });
});

// @desc    Get single registration by ID (Admin)
// @route   GET /api/v1/ngo-registration/admin/:id
// @access  Private (Admin)
exports.getRegistration = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const registration = await NgoRegistration.findById(id);

  if (!registration) {
    return res.status(404).json({
      success: false,
      error: 'Registration not found'
    });
  }

  res.status(200).json({
    success: true,
    data: registration
  });
});

// @desc    Update registration status (Admin)
// @route   PUT /api/v1/ngo-registration/admin/:id
// @access  Private (Admin)
exports.updateRegistrationStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, rejectionReason } = req.body;
  const adminFirebaseUid = req.firebaseUid;

  const registration = await NgoRegistration.findById(id);

  if (!registration) {
    return res.status(404).json({
      success: false,
      error: 'Registration not found'
    });
  }

  registration.status = status;
  registration.reviewedBy = adminFirebaseUid;
  registration.reviewedAt = new Date();
  if (rejectionReason) {
    registration.rejectionReason = rejectionReason;
  }

  await registration.save();

  // Create notification for NGO
  if (status === 'approved' || status === 'rejected') {
    const notificationType = status === 'approved' ? 'registration_approved' : 'registration_rejected';
    const title = status === 'approved' 
      ? 'Registration Approved' 
      : 'Registration Rejected';
    const message = status === 'approved'
      ? `Congratulations! Your NGO registration for "${registration.ngoName}" has been approved. You can now create requests.`
      : `Your NGO registration for "${registration.ngoName}" has been rejected.${rejectionReason ? ` Reason: ${rejectionReason}` : ''}`;

    await Notification.create({
      ngoFirebaseUid: registration.firebaseUid,
      type: notificationType,
      title,
      message,
      relatedId: registration._id.toString(),
      relatedType: 'registration'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Registration status updated successfully',
    data: registration
  });
});


