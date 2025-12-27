const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema(
  {
    firebaseUid: { type: String, required: true, unique: true, index: true },
    basic: {
      name: String,
      email: String,
      phone: String,
      photoUrl: String,
      firebaseUid: String,
      accountCreationDate: String,
    },
    gallery: [String],
    donorType: { type: String, enum: ['Individual', 'Restaurant', 'Event organizer', 'Company / CSR'], default: 'Individual' },
    organization: {
      organizationName: String,
      businessType: String,
      address: String,
      licenseNumber: String,
    },
    location: {
      pickupAddress: String,
      pincode: String,
      city: String,
      state: String,
      country: String,
    },
    preferences: {
      donationCategories: [String],
      preferredResourceTypes: [String],
      preferredAreas: [String],
      emergencyDonations: { type: Boolean, default: false },
      preferredPickupTime: String,
      notificationPreference: { type: String, enum: ['email', 'push', 'sms'], default: 'push' },
      nearbyNgoRadiusKm: { type: Number, default: 10 },
    },
    addressBook: [
      {
        label: { type: String, default: '' },
        addressLine: { type: String, default: '' },
        city: { type: String, default: '' },
        state: { type: String, default: '' },
        pincode: { type: String, default: '' },
        isDefault: { type: Boolean, default: false },
      },
    ],
    trust: {
      verifiedStatus: { type: Boolean, default: false },
      donorRating: { type: Number, default: 0 },
      trustBadges: [String],
    },
    notifications: {
      emailNotifications: { type: Boolean, default: true },
      pushNotifications: { type: Boolean, default: true },
      smsNotifications: { type: Boolean, default: false },
    },
    systemSecurity: {
      lastLoginTime: String,
      accountBlocked: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Profile', ProfileSchema);
