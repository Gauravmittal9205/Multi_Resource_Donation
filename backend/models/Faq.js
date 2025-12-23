const mongoose = require('mongoose');

const FaqSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      required: [true, 'Role is required'],
      enum: ['donors', 'ngos', 'volunteers'],
      index: true
    },
    question: {
      type: String,
      required: [true, 'Question is required'],
      trim: true
    },
    answer: {
      type: String,
      required: [true, 'Answer is required'],
      trim: true
    },
    order: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  { timestamps: true }
);

FaqSchema.index({ role: 1, question: 1 }, { unique: true });

module.exports = mongoose.model('Faq', FaqSchema);
