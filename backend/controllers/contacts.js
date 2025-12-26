const Contact = require('../models/Contact');
const asyncHandler = require('../middleware/async');

exports.createContact = async (req, res) => {
  try {
    const {
      firebaseUid,
      userType,
      organizationName,
      name,
      email,
      phone,
      queryType,
      message,
    } = req.body || {};

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, error: 'name, email and message are required' });
    }

    const contact = await Contact.create({
      firebaseUid,
      userType,
      organizationName,
      name,
      email,
      phone,
      queryType,
      message,
    });

    return res.status(201).json({ success: true, data: contact });
  } catch (err) {
    console.error('createContact error', err);
    return res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get all help messages (Admin)
// @route   GET /api/v1/contacts/admin/all
// @access  Private (Admin)
exports.getAllHelpMessages = asyncHandler(async (req, res) => {
  const { status, userType, queryType } = req.query;

  const query = {};
  if (status) query.status = status;
  if (userType) query.userType = userType;
  if (queryType) query.queryType = queryType;

  const messages = await Contact.find(query)
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    count: messages.length,
    data: messages
  });
});

// @desc    Update help message status (Admin)
// @route   PUT /api/v1/contacts/admin/:id
// @access  Private (Admin)
exports.updateHelpMessageStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['new', 'read', 'closed'].includes(status)) {
    return res.status(400).json({
      success: false,
      error: 'Valid status (new, read, closed) is required'
    });
  }

  const message = await Contact.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true }
  );

  if (!message) {
    return res.status(404).json({
      success: false,
      error: 'Help message not found'
    });
  }

  res.status(200).json({
    success: true,
    data: message
  });
});
