const mongoose = require('mongoose');

const DonationSchema = new mongoose.Schema(
  {
    donorFirebaseUid: {
      type: String,
      required: true,
      index: true
    },
    resourceType: {
      type: String,
      required: true,
      enum: ['Food', 'Clothes', 'Books', 'Medical Supplies', 'Other Essentials']
    },
    quantity: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      required: true,
      enum: ['kg', 'items', 'packets', 'boxes']
    },
    address: {
      addressLine: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true }
    },
    pickup: {
      pickupDate: { type: Date, required: true },
      timeSlot: {
        type: String,
        required: true,
        enum: ['Morning', 'Afternoon', 'Evening']
      }
    },
    notes: {
      type: String,
      default: ''
    },
    images: {
      type: [String],
      default: []
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    status: {
      type: String,
      enum: ['pending', 'assigned', 'volunteer_assigned', 'picked', 'completed', 'cancelled'],
      default: 'pending',
      index: true
    },
    cancelReason: {
      type: String,
      default: ''
    },
    cancelledAt: {
      type: Date,
      default: null
    },
    assignedNGO: {
      ngoFirebaseUid: {
        type: String,
        default: null
      },
      ngoName: {
        type: String,
        default: null
      },
      assignedAt: {
        type: Date,
        default: null
      },
      assignedBy: {
        type: String, // Admin Firebase UID
        default: null
      },
      assignedRequestId: {
        type: String, // NGO Request ID
        default: null
      }
    },
    assignedVolunteer: {
      volunteerId: {
        type: String,
        default: null
      },
      volunteerName: {
        type: String,
        default: null
      },
      volunteerPhone: {
        type: String,
        default: null
      },
      assignedAt: {
        type: Date,
        default: null
      },
      assignedBy: {
        type: String, // NGO Firebase UID
        default: null
      }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Donation', DonationSchema);
