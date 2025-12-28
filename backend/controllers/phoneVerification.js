const twilio = require('twilio');
const OTPService = require('../utils/otpService');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

const otpService = new OTPService();

// Initialize Twilio client with environment variables
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// @desc    Send OTP to phone number
// @route   POST /api/v1/auth/send-phone-otp
// @access  Public
exports.sendPhoneOTP = asyncHandler(async (req, res, next) => {
  const { phone } = req.body;

  if (!phone) {
    return next(new ErrorResponse('Phone number is required', 400));
  }

  // Check if Twilio is configured
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    return next(new ErrorResponse('Twilio is not configured. Please contact administrator.', 500));
  }

  if (!process.env.TWILIO_PHONE_NUMBER) {
    return next(new ErrorResponse('Twilio phone number is not configured. Please contact administrator.', 500));
  }

  try {
    // Format phone number to E.164 format if needed
    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
    
    // Check if To and From numbers are the same
    const twilioPhone = process.env.TWILIO_PHONE_NUMBER.trim();
    if (formattedPhone === twilioPhone) {
      return next(new ErrorResponse('Cannot send OTP to the same number as Twilio sender. Please use a different phone number.', 400));
    }
    
    // Generate OTP
    const otp = otpService.generateOTP();
    
    // Store OTP with phone number as the key
    otpService.clearOTP(formattedPhone);
    otpService.storeOTP(formattedPhone, otp);

    // Send OTP via Twilio
    await twilioClient.messages.create({
      body: `Your verification code for Multi-Resource Donation is: ${otp}`,
      from: twilioPhone,
      to: formattedPhone
    });

    res.status(200).json({
      success: true,
      message: 'OTP sent to your phone number',
      phone: formattedPhone
    });
  } catch (error) {
    console.error('Error sending phone OTP:', error);
    
    // Handle specific Twilio errors
    if (error.code === 21266) {
      return next(new ErrorResponse('Invalid Twilio configuration: Sender and receiver numbers cannot be the same. Please check your Twilio phone number configuration.', 400));
    }
    
    if (error.code === 21211) {
      return next(new ErrorResponse('Invalid phone number format. Please enter a valid phone number.', 400));
    }
    
    if (error.code === 21608) {
      return next(new ErrorResponse('This phone number is not verified. Please verify it in your Twilio account or use a different number.', 400));
    }
    
    if (error.code === 21614) {
      return next(new ErrorResponse('Invalid Twilio phone number. Please check your Twilio configuration.', 400));
    }
    
    // Generic error message
    const errorMessage = error.message || 'Failed to send OTP. Please try again.';
    return next(new ErrorResponse(errorMessage, 500));
  }
});

// @desc    Verify phone OTP
// @route   POST /api/v1/auth/verify-phone-otp
// @access  Public
exports.verifyPhoneOTP = asyncHandler(async (req, res, next) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    return next(new ErrorResponse('Phone number and OTP are required', 400));
  }

  try {
    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
    const verification = otpService.verifyOTP(formattedPhone, otp);

    if (!verification.success) {
      return next(new ErrorResponse(verification.message, 400));
    }

    res.status(200).json({
      success: true,
      message: 'Phone number verified successfully',
      phone: formattedPhone
    });
  } catch (error) {
    console.error('Error verifying phone OTP:', error);
    return next(new ErrorResponse('Failed to verify OTP', 500));
  }
});
