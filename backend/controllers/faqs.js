const Faq = require('../models/Faq');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

exports.getFaqs = asyncHandler(async (req, res, next) => {
  const query = {};

  if (req.query.role) {
    query.role = req.query.role;
  }

  if (req.query.userType) {
    query.userType = req.query.userType;
  }

  if (req.query.category) {
    query.category = req.query.category;
  }

  if (req.query.isActive !== undefined) {
    query.isActive = req.query.isActive === 'true';
  } else {
    query.isActive = true;
  }

  const faqs = await Faq.find(query).sort({ order: 1, createdAt: 1 });

  res.status(200).json({
    success: true,
    count: faqs.length,
    data: faqs
  });
});

exports.createFaq = asyncHandler(async (req, res, next) => {
  const faq = await Faq.create(req.body);

  res.status(201).json({
    success: true,
    data: faq
  });
});

exports.updateFaq = asyncHandler(async (req, res, next) => {
  const faq = await Faq.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!faq) {
    return next(new ErrorResponse(`FAQ not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: faq
  });
});

exports.deleteFaq = asyncHandler(async (req, res, next) => {
  const faq = await Faq.findByIdAndDelete(req.params.id);

  if (!faq) {
    return next(new ErrorResponse(`FAQ not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: {}
  });
});
