const mongoose = require('mongoose');

const NgoRequestSchema = new mongoose.Schema(
  {
    ngoFirebaseUid: {
      type: String,
      required: true,
      index: true
    },
    requestTitle: {
      type: String,
      required: [true, 'Please provide a request title'],
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Please select a category'],
      enum: ['food', 'clothing', 'medical', 'education', 'other']
    },
    quantity: {
      type: Number,
      required: [true, 'Please provide quantity needed'],
      min: [1, 'Quantity must be at least 1']
    },
    urgencyLevel: {
      type: String,
      required: [true, 'Please select urgency level'],
      enum: ['low', 'medium', 'high']
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
      trim: true
    },
    neededBy: {
      type: Date,
      default: null
    },
    images: {
      type: [String],
      default: []
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'fulfilled', 'cancelled'],
      default: 'pending',
      index: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('NgoRequest', NgoRequestSchema);

