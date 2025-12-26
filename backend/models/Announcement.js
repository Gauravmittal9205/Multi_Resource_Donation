const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true
    },
    type: {
      type: String,
      enum: ['volunteer_assigned', 'donation_assigned', 'pickup_completed', 'system'],
      default: 'system'
    },
    donationId: {
      type: String,
      default: null
    },
    ngoName: {
      type: String,
      default: null
    },
    volunteerName: {
      type: String,
      default: null
    },
    isRead: {
      type: Boolean,
      default: false
    },
    createdBy: {
      type: String, // Firebase UID of creator (NGO or System)
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Announcement', AnnouncementSchema);

