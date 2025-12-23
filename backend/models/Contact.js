const mongoose = require('mongoose');

const ContactSchema = new mongoose.Schema(
  {
    firebaseUid: { type: String, index: true },
    userType: { type: String, enum: ['donor', 'ngo'] },
    organizationName: { type: String },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    phone: { type: String, default: '' },
    queryType: { type: String, default: '' },
    message: { type: String, required: true, trim: true },
    status: { type: String, enum: ['new', 'read', 'closed'], default: 'new' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Contact', ContactSchema);
