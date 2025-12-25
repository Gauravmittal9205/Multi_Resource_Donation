const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema(
  {
    ngoFirebaseUid: {
      type: String,
      required: true,
      index: true
    },
    subject: {
      type: String,
      required: [true, 'Please provide a subject'],
      trim: true
    },
    feedbackType: {
      type: String,
      required: [true, 'Please select feedback type'],
      enum: ['suggestion', 'bug', 'feature', 'complaint', 'other']
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
      trim: true
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },
    screenshot: {
      type: String,
      default: null
    },
    contactPermission: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['new', 'read', 'in-progress', 'resolved', 'closed'],
      default: 'new',
      index: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Feedback', FeedbackSchema);

