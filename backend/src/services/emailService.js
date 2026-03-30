/**
 * Email Service
 * Email sending functionality using Nodemailer
 */

const nodemailer = require('nodemailer');

// Email configuration
const EMAIL_CONFIG = {
  from: process.env.EMAIL_FROM || 'noreply@mileagetracker.co.uk',
  fromName: process.env.EMAIL_FROM_NAME || 'Mileage Tracker',
};

// Create transporter based on environment
const createTransporter = () => {
  // In development, use ethereal.email (fake SMTP)
  if (process.env.NODE_ENV === 'development' && !process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: process.env.ETHEREAL_USER,
        pass: process.env.ETHEREAL_PASS,
      },
    });
  }

  // Production SMTP configuration
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Lazy-loaded transporter
let transporter = null;
const getTransporter = () => {
  if (!transporter) {
    transporter = createTransporter();
  }
  return transporter;
};

/**
 * Send email
 * @param {Object} options - Email options
 * @returns {Promise<Object>} Send result
 */
const sendEmail = async (options) => {
  const { to, subject, text, html, attachments = [] } = options;

  try {
    const mailOptions = {
      from: `"${EMAIL_CONFIG.fromName}" <${EMAIL_CONFIG.from}>`,
      to,
      subject,
      text,
      html,
      attachments,
    };

    const info = await getTransporter().sendMail(mailOptions);

    console.log('Email sent:', info.messageId);

    // In development, log the preview URL
    if (process.env.NODE_ENV === 'development' && info.ethereal) {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl: info.ethereal ? nodemailer.getTestMessageUrl(info) : null,
    };
  } catch (error) {
    console.error('Email send error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Send welcome email to new user
 * @param {Object} user - User object
 * @returns {Promise<Object>} Send result
 */
const sendWelcomeEmail = async (user) => {
  const subject = 'Welcome to Mileage Tracker!';
  
  const text = `
Hi ${user.firstName},

Welcome to Mileage Tracker - your UK HMRC-compliant mileage tracking solution!

Your account has been successfully created. You can now:
- Log your business mileage trips
- Generate HMRC-compliant reports
- Track your mileage expenses

Get started by logging in at: ${process.env.CLIENT_URL || 'http://localhost:5173'}/login

If you have any questions, please don't hesitate to contact us.

Best regards,
The Mileage Tracker Team
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
    .content { background: #f9fafb; padding: 20px; }
    .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to Mileage Tracker!</h1>
    </div>
    <div class="content">
      <p>Hi ${user.firstName},</p>
      <p>Welcome to Mileage Tracker - your UK HMRC-compliant mileage tracking solution!</p>
      <p>Your account has been successfully created. You can now:</p>
      <ul>
        <li>Log your business mileage trips</li>
        <li>Generate HMRC-compliant reports</li>
        <li>Track your mileage expenses</li>
      </ul>
      <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/login" class="button">Get Started</a>
      <p>If you have any questions, please don't hesitate to contact us.</p>
      <p>Best regards,<br>The Mileage Tracker Team</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Mileage Tracker. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return sendEmail({
    to: user.email,
    subject,
    text,
    html,
  });
};

/**
 * Send password reset email
 * @param {Object} user - User object
 * @param {string} resetToken - Password reset token
 * @param {string} resetUrl - Password reset URL
 * @returns {Promise<Object>} Send result
 */
const sendPasswordResetEmail = async (user, resetToken, resetUrl) => {
  const subject = 'Password Reset Request';
  
  const text = `
Hi ${user.firstName},

You recently requested to reset your password for your Mileage Tracker account.

Click the link below to reset your password:
${resetUrl}?token=${resetToken}

This link will expire in 1 hour for security reasons.

If you did not request a password reset, please ignore this email or contact support if you have concerns.

Best regards,
The Mileage Tracker Team
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
    .content { background: #f9fafb; padding: 20px; }
    .button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
    .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 10px; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Password Reset Request</h1>
    </div>
    <div class="content">
      <p>Hi ${user.firstName},</p>
      <p>You recently requested to reset your password for your Mileage Tracker account.</p>
      <a href="${resetUrl}?token=${resetToken}" class="button">Reset Password</a>
      <div class="warning">
        <strong>Important:</strong> This link will expire in 1 hour for security reasons.
      </div>
      <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
      <p>Best regards,<br>The Mileage Tracker Team</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Mileage Tracker. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return sendEmail({
    to: user.email,
    subject,
    text,
    html,
  });
};

/**
 * Send email verification email
 * @param {Object} user - User object
 * @param {string} verificationToken - Verification token
 * @param {string} verificationUrl - Verification URL
 * @returns {Promise<Object>} Send result
 */
const sendVerificationEmail = async (user, verificationToken, verificationUrl) => {
  const subject = 'Verify Your Email Address';
  
  const text = `
Hi ${user.firstName},

Thank you for registering with Mileage Tracker!

Please verify your email address by clicking the link below:
${verificationUrl}?token=${verificationToken}

This link will expire in 24 hours.

If you did not create an account, please ignore this email.

Best regards,
The Mileage Tracker Team
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
    .content { background: #f9fafb; padding: 20px; }
    .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Verify Your Email Address</h1>
    </div>
    <div class="content">
      <p>Hi ${user.firstName},</p>
      <p>Thank you for registering with Mileage Tracker!</p>
      <p>Please verify your email address by clicking the button below:</p>
      <a href="${verificationUrl}?token=${verificationToken}" class="button">Verify Email</a>
      <p>This link will expire in 24 hours.</p>
      <p>If you did not create an account, please ignore this email.</p>
      <p>Best regards,<br>The Mileage Tracker Team</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Mileage Tracker. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return sendEmail({
    to: user.email,
    subject,
    text,
    html,
  });
};

/**
 * Send password changed confirmation email
 * @param {Object} user - User object
 * @returns {Promise<Object>} Send result
 */
const sendPasswordChangedEmail = async (user) => {
  const subject = 'Password Changed Successfully';
  
  const text = `
Hi ${user.firstName},

Your password has been successfully changed.

If you did not make this change, please contact us immediately.

Best regards,
The Mileage Tracker Team
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10b981; color: white; padding: 20px; text-align: center; }
    .content { background: #f9fafb; padding: 20px; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Password Changed Successfully</h1>
    </div>
    <div class="content">
      <p>Hi ${user.firstName},</p>
      <p>Your password has been successfully changed.</p>
      <p>If you did not make this change, please contact us immediately.</p>
      <p>Best regards,<br>The Mileage Tracker Team</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Mileage Tracker. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return sendEmail({
    to: user.email,
    subject,
    text,
    html,
  });
};

/**
 * Send report ready notification
 * @param {Object} user - User object
 * @param {Object} report - Report object
 * @returns {Promise<Object>} Send result
 */
const sendReportReadyEmail = async (user, report) => {
  const subject = `Your Report is Ready: ${report.name}`;
  
  const text = `
Hi ${user.firstName},

Your mileage report "${report.name}" is now ready for download.

Report Details:
- Period: ${new Date(report.dateFrom).toLocaleDateString('en-GB')} - ${new Date(report.dateTo).toLocaleDateString('en-GB')}
- Total Miles: ${report.totalMiles}
- Total Amount: £${report.totalAmount}
- Format: ${report.format.toUpperCase()}

You can download your report from your dashboard.

Best regards,
The Mileage Tracker Team
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
    .content { background: #f9fafb; padding: 20px; }
    .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
    .details { background: white; padding: 15px; border-radius: 4px; margin: 15px 0; }
    .details p { margin: 5px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Your Report is Ready!</h1>
    </div>
    <div class="content">
      <p>Hi ${user.firstName},</p>
      <p>Your mileage report "${report.name}" is now ready for download.</p>
      <div class="details">
        <p><strong>Period:</strong> ${new Date(report.dateFrom).toLocaleDateString('en-GB')} - ${new Date(report.dateTo).toLocaleDateString('en-GB')}</p>
        <p><strong>Total Miles:</strong> ${report.totalMiles}</p>
        <p><strong>Total Amount:</strong> £${report.totalAmount}</p>
        <p><strong>Format:</strong> ${report.format.toUpperCase()}</p>
      </div>
      <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/reports" class="button">View Reports</a>
      <p>Best regards,<br>The Mileage Tracker Team</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Mileage Tracker. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return sendEmail({
    to: user.email,
    subject,
    text,
    html,
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendPasswordChangedEmail,
  sendReportReadyEmail,
  EMAIL_CONFIG,
};
