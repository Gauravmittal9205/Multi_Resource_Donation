const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    recipientFirebaseUid: {
      type: String,
      required: true,
      index: true
    },
    eventType: {
      type: String,
      default: null,
      index: true
    },
    relatedType: {
      type: String,
      enum: ['request', 'donation', null],
      default: null,
      index: true
    },
    relatedId: {
      type: String,
      default: null,
      index: true
    },
    category: {
      type: String,
      required: true,
      enum: ['donations', 'pickups', 'system'],
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    donationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donation',
      default: null
    },
    redirectUrl: {
      type: String,
      default: null // URL to redirect when notification is clicked
    },
    read: {
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

// Indexes for efficient queries
NotificationSchema.index({ recipientFirebaseUid: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ recipientFirebaseUid: 1, category: 1, createdAt: -1 });
NotificationSchema.index({ recipientFirebaseUid: 1, relatedType: 1, relatedId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);

