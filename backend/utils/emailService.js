const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'gauravmittal939@gmail.com',
        pass: 'vwtk wwbt mqwh ihrm'
      }
    });
  }

  async sendVerificationEmail(email, otp) {
    try {
      const mailOptions = {
        from: 'ShareCare <gauravmittal939@gmail.com>',
        to: email,
        subject: 'Verify your email address - ShareCare',
        html: `
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">ShareCare</h1>
              <p style="color: #d1fae5; margin: 10px 0 0 0;">Email Verification</p>
            </div>
            
            <div style="background: white; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
              <h2 style="color: #1f2937; margin: 0 0 20px 0;">Verify Your Email Address</h2>
              <p style="color: #6b7280; line-height: 1.6; margin: 0 0 30px 0;">
                Thank you for signing up for ShareCare! To complete your registration, please use the verification code below:
              </p>
              
              <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 30px 0;">
                <p style="color: #6b7280; margin: 0 0 10px 0; font-size: 14px;">Your verification code is:</p>
                <div style="font-size: 32px; font-weight: bold; color: #059669; letter-spacing: 4px; margin: 10px 0;">${otp}</div>
              </div>
              
              <p style="color: #6b7280; line-height: 1.6; margin: 30px 0 0 0; font-size: 14px;">
                This code will expire in <strong>10 minutes</strong>. If you didn't request this verification, please ignore this email.
              </p>
              
              <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="color: #9ca3af; margin: 0; font-size: 12px; text-align: center;">
                  This is an automated message from ShareCare. Please do not reply to this email.
                </p>
              </div>
            </div>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Verification email sent to ${email}`);
      return true;
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw error;
    }
  }

  async sendWelcomeEmail(email, name) {
    try {
      const mailOptions = {
        from: 'ShareCare <gauravmittal939@gmail.com>',
        to: email,
        subject: 'Welcome to ShareCare!',
        html: `
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">ShareCare</h1>
              <p style="color: #d1fae5; margin: 10px 0 0 0;">Welcome!</p>
            </div>
            
            <div style="background: white; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
              <h2 style="color: #1f2937; margin: 0 0 20px 0;">Welcome to ShareCare, ${name}!</h2>
              <p style="color: #6b7280; line-height: 1.6; margin: 0 0 30px 0;">
                Thank you for joining our community! Your account has been successfully created and you can now start using our platform.
              </p>
              
              <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #10b981;">
                <h3 style="color: #059669; margin: 0 0 10px 0;">What's Next?</h3>
                <ul style="color: #6b7280; line-height: 1.6; margin: 0; padding-left: 20px;">
                  <li>Complete your profile</li>
                  <li>Explore donation opportunities</li>
                  <li>Connect with donors and NGOs</li>
                  <li>Make a difference in your community</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 40px 0;">
                <a href="#" style="background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Get Started
                </a>
              </div>
              
              <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="color: #9ca3af; margin: 0; font-size: 12px; text-align: center;">
                  This is an automated message from ShareCare. Please do not reply to this email.
                </p>
              </div>
            </div>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Welcome email sent to ${email}`);
      return true;
    } catch (error) {
      console.error('Error sending welcome email:', error);
      throw error;
    }
  }
}

module.exports = EmailService;
