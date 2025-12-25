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
    },
    // Dynamic fields based on category
    // Food category fields
    foodType: {
      type: String,
      enum: ['Veg', 'Non-Veg', ''],
      default: ''
    },
    foodCategory: {
      type: String,
      enum: ['Cooked', 'Packed', 'Raw', ''],
      default: ''
    },
    approxWeight: {
      type: Number,
      default: null
    },
    expiryTime: {
      type: Date,
      default: null
    },
    // Clothing category fields
    clothingType: {
      type: String,
      enum: ['Men', 'Women', 'Kids', ''],
      default: ''
    },
    condition: {
      type: String,
      enum: ['New', 'Gently Used', ''],
      default: ''
    },
    season: {
      type: String,
      enum: ['Summer', 'Winter', 'All-season', ''],
      default: ''
    },
    // Medical category fields
    medicalType: {
      type: String,
      enum: ['Medicines', 'Medical Equipment', 'First Aid Supplies', 'Sanitary Products', 'Other', ''],
      default: ''
    },
    expiryDate: {
      type: Date,
      default: null
    },
    storageRequirements: {
      type: String,
      trim: true,
      default: ''
    },
    // Education category fields
    bookType: {
      type: String,
      enum: ['Textbooks', 'Story Books', 'Reference Books', 'Notebooks', 'Stationery', 'Other', ''],
      default: ''
    },
    subject: {
      type: String,
      trim: true,
      default: ''
    },
    ageGroup: {
      type: String,
      trim: true,
      default: ''
    },
    // Other category fields
    itemType: {
      type: String,
      trim: true,
      default: ''
    },
    specifications: {
      type: String,
      trim: true,
      default: ''
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('NgoRequest', NgoRequestSchema);

