const mongoose = require('mongoose');

const NgoProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  organizationName: {
    type: String,
    required: [true, 'Please add an organization name'],
    trim: true,
    maxlength: [100, 'Organization name cannot be more than 100 characters']
  },
  registrationNumber: {
    type: String,
    required: [true, 'Please add a registration number'],
    unique: true,
    trim: true
  },
  contactPerson: {
    name: {
      type: String,
      required: [true, 'Please add a contact person name'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Please add a contact email'],
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email'
      ]
    },
    phone: {
      type: String,
      required: [true, 'Please add a contact phone number'],
      match: [
        /^[0-9]{10}$/,
        'Please add a valid 10-digit phone number'
      ]
    }
  },
  address: {
    street: { type: String, required: [true, 'Please add a street address'] },
    city: { type: String, required: [true, 'Please add a city'] },
    state: { type: String, required: [true, 'Please add a state'] },
    pincode: {
      type: String,
      required: [true, 'Please add a pincode'],
      match: [/^[1-9][0-9]{5}$/, 'Please add a valid 6-digit pincode']
    },
    country: { type: String, default: 'India' }
  },
  website: {
    type: String,
    match: [
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
      'Please use a valid URL with HTTP or HTTPS'
    ]
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  areasOfOperation: [{
    type: String,
    trim: true
  }],
  yearOfEstablishment: {
    type: Number,
    min: [1900, 'Year must be after 1900'],
    max: [new Date().getFullYear(), 'Year cannot be in the future']
  },
  documents: {
    registrationCertificate: {
      url: String,
      filename: String,
      uploadedAt: Date
    },
    logo: {
      url: String,
      filename: String,
      uploadedAt: Date
    }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create a compound index for faster queries
NgoProfileSchema.index({ user: 1 });
NgoProfileSchema.index({ 'contactPerson.email': 1 }, { unique: true });

// Middleware to update the updatedAt field
NgoProfileSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Static method to get the profile by user ID
NgoProfileSchema.statics.getByUserId = async function(userId) {
  return await this.findOne({ user: userId });
};

module.exports = mongoose.model('NgoProfile', NgoProfileSchema);
