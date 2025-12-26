const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    ngoFirebaseUid: {
      type: String,
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['request_approved', 'request_rejected', 'registration_approved', 'registration_rejected'],
      required: true
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    relatedId: {
      type: String, // ID of the related request or registration
      required: true
    },
    relatedType: {
      type: String,
      enum: ['request', 'registration'],
      required: true
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    },
    readAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

// Index for efficient queries
NotificationSchema.index({ ngoFirebaseUid: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);

