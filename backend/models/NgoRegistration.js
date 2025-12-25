const mongoose = require('mongoose');

const NgoRegistrationSchema = new mongoose.Schema(
  {
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    // Step 1: Basic Identity
    organizationType: {
      type: String,
      required: [true, 'Organization type is required'],
      enum: ['NGO', 'Trust']
    },
    ngoName: {
      type: String,
      required: [true, 'Organization/NGO name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    contactPerson: {
      type: String,
      required: [true, 'Contact person name is required'],
      trim: true,
      maxlength: [50, 'Contact person name cannot exceed 50 characters']
    },
    phone: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Please provide a valid 10-digit mobile number']
    },
    // Step 2: Location Details
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      trim: true,
      match: [/^\d{6}$/, 'Pincode must be exactly 6 digits']
    },
    pickupDeliveryPreference: {
      type: String,
      required: [true, 'Pickup/Delivery preference is required'],
      enum: ['Pickup', 'Delivery', 'Both']
    },
    // Step 3: Identity Proof
    aadhaarNumber: {
      type: String,
      required: [true, 'Aadhaar number is required'],
      trim: true,
      match: [/^\d{12}$/, 'Aadhaar number must be exactly 12 digits']
    },
    aadhaarCard: {
      type: String, // URL or file path
      default: ''
    },
    alternateIdType: {
      type: String,
      enum: ['PAN', 'Voter ID', 'Passport', ''],
      default: ''
    },
    alternateIdFile: {
      type: String, // URL or file path
      default: ''
    },
    // Step 4: Organization Documents
    registrationNumber: {
      type: String,
      required: [true, 'Registration number is required'],
      trim: true
    },
    ngoCertificate: {
      type: String, // URL or file path
      required: [true, 'NGO certificate is required']
    },
    addressProof: {
      type: String, // URL or file path
      required: [true, 'Address proof is required']
    },
    // Step 5: Verification
    declarationAccepted: {
      type: Boolean,
      required: [true, 'Declaration must be accepted'],
      default: false
    },
    verificationConsent: {
      type: Boolean,
      required: [true, 'Verification consent must be provided'],
      default: false
    },
    // Status
    status: {
      type: String,
      enum: ['pending', 'under_review', 'approved', 'rejected'],
      default: 'pending',
      index: true
    },
    // Admin review fields
    reviewedBy: {
      type: String, // Admin Firebase UID
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    },
    rejectionReason: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('NgoRegistration', NgoRegistrationSchema);

