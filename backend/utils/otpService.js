class OTPService {
  constructor() {
    this.otpStore = new Map(); // In-memory storage for OTPs
    this.OTP_EXPIRY_TIME = 10 * 60 * 1000; // 10 minutes in milliseconds
    this.MAX_ATTEMPTS = 3;
  }

  generateOTP() {
    // Generate 6-digit OTP
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  storeOTP(email, otp) {
    const expiryTime = Date.now() + this.OTP_EXPIRY_TIME;
    
    // Clear any existing OTP for this email first to ensure fresh start
    if (this.otpStore.has(email)) {
      console.log(`Clearing existing OTP for ${email} before storing new one`);
      this.otpStore.delete(email);
    }
    
    this.otpStore.set(email, {
      otp,
      attempts: 0,
      maxAttempts: this.MAX_ATTEMPTS,
      expiryTime
    });

    console.log(`OTP stored for ${email}, expires at: ${new Date(expiryTime)}, attempts reset to 0`);
  }

  verifyOTP(email, userOTP) {
    console.log(`Verifying OTP for ${email}: user provided "${userOTP}"`);
    
    const storedData = this.otpStore.get(email);
    if (!storedData) {
      console.log(`No OTP found for ${email}`);
      return { success: false, message: 'OTP not found or expired' };
    }

    console.log(`Found OTP for ${email}: stored "${storedData.otp}", attempts: ${storedData.attempts}/${storedData.maxAttempts}, expires: ${new Date(storedData.expiryTime)}`);

    // Check if OTP has expired
    if (Date.now() > storedData.expiryTime) {
      console.log(`OTP expired for ${email}`);
      this.otpStore.delete(email);
      return { success: false, message: 'OTP has expired' };
    }

    // Check maximum attempts BEFORE incrementing
    if (storedData.attempts >= storedData.maxAttempts) {
      console.log(`Maximum attempts exceeded for ${email} - clearing OTP`);
      this.otpStore.delete(email);
      return { 
        success: false, 
        message: 'Maximum attempts exceeded. Please request a new OTP.',
        canRequestNewOTP: true 
      };
    }

    // Increment attempts
    storedData.attempts++;

    // Verify OTP
    if (storedData.otp === userOTP) {
      console.log(`OTP verified successfully for ${email}`);
      this.otpStore.delete(email); // Clear OTP after successful verification
      return { success: true, message: 'OTP verified successfully' };
    } else {
      const remainingAttempts = storedData.maxAttempts - storedData.attempts;
      console.log(`Invalid OTP for ${email}: expected "${storedData.otp}", got "${userOTP}", ${remainingAttempts} attempts remaining`);
      
      if (remainingAttempts === 0) {
        console.log(`Maximum attempts reached for ${email} - clearing OTP`);
        this.otpStore.delete(email);
        return { 
          success: false, 
          message: 'Maximum attempts exceeded. Please request a new OTP.',
          canRequestNewOTP: true 
        };
      }
      
      return { 
        success: false, 
        message: `Invalid OTP. ${remainingAttempts} attempts remaining.` 
      };
    }
  }

  getRemainingTime(email) {
    const storedData = this.otpStore.get(email);
    if (!storedData) {
      return 0;
    }

    const remainingTime = storedData.expiryTime - Date.now();
    return Math.max(0, Math.floor(remainingTime / 1000)); // Return in seconds
  }

  clearOTP(email) {
    if (this.otpStore.has(email)) {
      this.otpStore.delete(email);
      console.log(`OTP cleared for ${email}`);
    }
  }

  // Debug method to get OTP for testing
  getOTPForEmail(email) {
    const storedData = this.otpStore.get(email);
    if (storedData) {
      return {
        otp: storedData.otp,
        expires: new Date(storedData.expiryTime),
        attempts: storedData.attempts,
        remainingTime: this.getRemainingTime(email)
      };
    }
    return null;
  }

  // Clean up expired OTPs (should be called periodically)
  cleanupExpiredOTPs() {
    const now = Date.now();
    for (const [email, data] of this.otpStore.entries()) {
      if (now > data.expiryTime) {
        this.otpStore.delete(email);
        console.log(`Cleaned up expired OTP for ${email}`);
      }
    }
  }
}

module.exports = OTPService;
