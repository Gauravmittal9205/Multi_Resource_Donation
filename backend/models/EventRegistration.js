const mongoose = require('mongoose');

const EventRegistrationSchema = new mongoose.Schema({
  eventId: {
    type: String,
    required: [true, 'Event ID is required'],
    trim: true
  },
  eventTitle: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true
  },
  eventType: {
    type: String,
    required: [true, 'Event type is required'],
    enum: ['food', 'training', 'fundraising', 'other']
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[0-9\-\+\(\)\s]+$/, 'Please add a valid phone number']
  },
  message: {
    type: String,
    trim: true
  },
  registrationDate: {
    type: Date,
    default: Date.now
  }
});

// Create a compound index to prevent duplicate registrations
EventRegistrationSchema.index({ eventId: 1, email: 1 }, { unique: true });

module.exports = mongoose.model('EventRegistration', EventRegistrationSchema);
