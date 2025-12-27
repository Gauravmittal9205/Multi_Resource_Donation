const mongoose = require('mongoose');

const NgoProfileSchema = new mongoose.Schema(
  {
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    basic: {
      logoUrl: { type: String, default: '' },
      tagline: { type: String, default: '', maxlength: 120 },
      aboutHtml: { type: String, default: '' },
      contactPersonName: { type: String, default: '' },
      phone: { type: String, default: '' },
      email: { type: String, default: '' },
      website: { type: String, default: '' },
      socialLinks: {
        facebook: { type: String, default: '' },
        instagram: { type: String, default: '' },
        linkedin: { type: String, default: '' },
        twitter: { type: String, default: '' },
        youtube: { type: String, default: '' }
      }
    },

    operationalAreas: {
      type: [String],
      default: []
    },

    mission: {
      missionStatement: { type: String, default: '' },
      visionStatement: { type: String, default: '' },
      focusAreas: { type: [String], default: [] },
      beneficiaryTypes: { type: [String], default: [] },
      foundedYear: { type: Number, default: null }
    },

    acceptance: {
      // This config is intentionally flexible so we can evolve resource-specific fields without migrations.
      resources: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
      }
    },

    logistics: {
      pickupAvailable: { type: Boolean, default: true },
      pickupAreas: { type: [String], default: [] },
      preferredPickupTime: { type: String, default: '' },
      dropLocation: { type: String, default: '' },
      emergencyAcceptance: { type: Boolean, default: false }
    },

    monetary: {
      bankName: { type: String, default: '' },
      accountName: { type: String, default: '' },
      accountNumber: { type: String, default: '' },
      ifsc: { type: String, default: '' },
      upiId: { type: String, default: '' },
      minimumDonationAmount: { type: Number, default: null },
      purposeAllocation: { type: String, default: '' }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('NgoProfile', NgoProfileSchema);
