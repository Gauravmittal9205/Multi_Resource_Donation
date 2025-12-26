const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    recipientFirebaseUid: { type: String, required: true, index: true },
    category: {
      type: String,
      required: true,
      enum: ['donations', 'pickups', 'ngo_requests', 'system'],
      index: true
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    read: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', NotificationSchema);
