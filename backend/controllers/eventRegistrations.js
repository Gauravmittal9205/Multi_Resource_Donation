const EventRegistration = require('../models/EventRegistration');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Register for an event
// @route   POST /api/v1/event-registrations
// @access  Public
exports.registerForEvent = asyncHandler(async (req, res, next) => {
  const {
    eventId,
    eventTitle,
    eventType,
    name,
    email,
    phone,
    message
  } = req.body;

  const existing = await EventRegistration.findOne({ eventId, email });
  if (existing) {
    return next(new ErrorResponse('You have already registered for this event with this email.', 400));
  }

  // Create event registration
  const registration = await EventRegistration.create({
    eventId,
    eventTitle,
    eventType,
    name,
    email,
    phone,
    message
  });

  res.status(201).json({
    success: true,
    data: registration
  });
});

// @desc    Get all event registrations (for admin)
// @route   GET /api/v1/event-registrations
// @access  Private/Admin
exports.getEventRegistrations = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get registrations for a specific event
// @route   GET /api/v1/event-registrations/event/:eventId
// @access  Private/Admin
exports.getEventRegistrationsByEvent = asyncHandler(async (req, res, next) => {
  const registrations = await EventRegistration.find({ eventId: req.params.eventId });
  
  res.status(200).json({
    success: true,
    count: registrations.length,
    data: registrations
  });
});

// @desc    Get a single registration
// @route   GET /api/v1/event-registrations/:id
// @access  Private/Admin
exports.getRegistration = asyncHandler(async (req, res, next) => {
  const registration = await EventRegistration.findById(req.params.id);

  if (!registration) {
    return next(
      new ErrorResponse(`Registration not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: registration
  });
});

// @desc    Delete registration
// @route   DELETE /api/v1/event-registrations/:id
// @access  Private/Admin
exports.deleteRegistration = asyncHandler(async (req, res, next) => {
  const registration = await EventRegistration.findByIdAndDelete(req.params.id);

  if (!registration) {
    return next(
      new ErrorResponse(`Registration not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: {}
  });
});
