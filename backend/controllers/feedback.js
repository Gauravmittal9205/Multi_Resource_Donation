const Feedback = require('../models/Feedback');
const asyncHandler = require('../middleware/async');

// @desc    Create feedback
// @route   POST /api/v1/feedback
// @access  Private (Firebase)
exports.createFeedback = asyncHandler(async (req, res) => {
  const ngoFirebaseUid = req.firebaseUid;

  const {
    subject,
    feedbackType,
    description,
    rating,
    screenshot,
    contactPermission
  } = req.body;

  const feedback = await Feedback.create({
    ngoFirebaseUid,
    subject,
    feedbackType,
    description,
    rating: rating ? Number(rating) : null,
    screenshot: screenshot || null,
    contactPermission: contactPermission || false,
    status: 'new'
  });

  res.status(201).json({
    success: true,
    data: feedback
  });
});

// @desc    Get all feedback for logged in NGO
// @route   GET /api/v1/feedback
// @access  Private (Firebase)
exports.getMyFeedback = asyncHandler(async (req, res) => {
  const ngoFirebaseUid = req.firebaseUid;
  const { status, feedbackType } = req.query;

  const query = { ngoFirebaseUid };
  if (status) query.status = status;
  if (feedbackType) query.feedbackType = feedbackType;

  const feedbacks = await Feedback.find(query)
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    count: feedbacks.length,
    data: feedbacks
  });
});

// @desc    Get single feedback by ID
// @route   GET /api/v1/feedback/:id
// @access  Private (Firebase)
exports.getFeedback = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const ngoFirebaseUid = req.firebaseUid;

  const feedback = await Feedback.findOne({
    _id: id,
    ngoFirebaseUid
  });

  if (!feedback) {
    return res.status(404).json({
      success: false,
      error: 'Feedback not found'
    });
  }

  res.status(200).json({
    success: true,
    data: feedback
  });
});

// @desc    Update feedback
// @route   PUT /api/v1/feedback/:id
// @access  Private (Firebase)
exports.updateFeedback = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const ngoFirebaseUid = req.firebaseUid;

  const {
    subject,
    feedbackType,
    description,
    rating,
    screenshot,
    contactPermission
  } = req.body;

  let feedback = await Feedback.findOne({
    _id: id,
    ngoFirebaseUid
  });

  if (!feedback) {
    return res.status(404).json({
      success: false,
      error: 'Feedback not found'
    });
  }

  // Update fields
  if (subject) feedback.subject = subject;
  if (feedbackType) feedback.feedbackType = feedbackType;
  if (description) feedback.description = description;
  if (rating !== undefined) feedback.rating = rating ? Number(rating) : null;
  if (screenshot !== undefined) feedback.screenshot = screenshot || null;
  if (contactPermission !== undefined) feedback.contactPermission = contactPermission;

  await feedback.save();

  res.status(200).json({
    success: true,
    data: feedback
  });
});

// @desc    Delete feedback
// @route   DELETE /api/v1/feedback/:id
// @access  Private (Firebase)
exports.deleteFeedback = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const ngoFirebaseUid = req.firebaseUid;

  const feedback = await Feedback.findOneAndDelete({
    _id: id,
    ngoFirebaseUid
  });

  if (!feedback) {
    return res.status(404).json({
      success: false,
      error: 'Feedback not found'
    });
  }

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get all feedback (Admin)
// @route   GET /api/v1/feedback/admin/all
// @access  Private (Admin)
exports.getAllFeedback = asyncHandler(async (req, res) => {
  const { status, feedbackType } = req.query;

  const query = {};
  if (status) query.status = status;
  if (feedbackType) query.feedbackType = feedbackType;

  const feedbacks = await Feedback.find(query)
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    count: feedbacks.length,
    data: feedbacks
  });
});

// @desc    Update feedback status (Admin)
// @route   PUT /api/v1/feedback/admin/:id
// @access  Private (Admin)
exports.updateFeedbackStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const feedback = await Feedback.findById(id);

  if (!feedback) {
    return res.status(404).json({
      success: false,
      error: 'Feedback not found'
    });
  }

  feedback.status = status;
  await feedback.save();

  res.status(200).json({
    success: true,
    data: feedback
  });
});

