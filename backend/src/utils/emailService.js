const nodemailer = require('nodemailer');

const maskEmail = (email) => {
  if (!email) return '[missing]';
  const [local, domain] = email.split('@');
  if (!domain) return email;
  return `${local[0] || ''}***@${domain}`;
};

// Create transporter with visible config logging (no password)
const createTransporter = () => {
  const requiredEnvVars = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASSWORD', 'EMAIL_FROM'];
  const missingVars = requiredEnvVars.filter((v) => !process.env[v]);

  if (missingVars.length > 0) {
    console.error('Missing email configuration:', missingVars.join(', '));
    console.error('Please configure EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD, and EMAIL_FROM in your .env file');
  }

  const port = parseInt(process.env.EMAIL_PORT, 10);
  const secure = process.env.EMAIL_SECURE ? process.env.EMAIL_SECURE === 'true' : port === 465;

  const transportConfig = {
    host: process.env.EMAIL_HOST,
    port,
    secure, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    tls: {
      rejectUnauthorized: false // Accept self-signed certificates
    },
    logger: true, // nodemailer internal logging (no passwords)
    debug: true // enable SMTP traffic logs
  };

  console.log('[Email] Creating transporter with:', {
    host: transportConfig.host,
    port: transportConfig.port,
    secure: transportConfig.secure,
    from: maskEmail(process.env.EMAIL_FROM),
    user: maskEmail(process.env.EMAIL_USER)
  });

  return nodemailer.createTransport(transportConfig);
};

const verifyTransporter = async (transporter) => {
  try {
    await transporter.verify();
    console.log('[Email] Transporter verification succeeded');
  } catch (err) {
    console.error('[Email] Transporter verification failed:', {
      message: err?.message,
      code: err?.code,
      command: err?.command,
      response: err?.response,
      responseCode: err?.responseCode
    });
    throw err;
  }
};

const sendMail = async ({ toEmail, subject, html, context }) => {
  const transporter = createTransporter();
  await verifyTransporter(transporter);

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: toEmail,
    subject,
    html
  };

  try {
    console.log(`[Email] Sending (${context}) to`, maskEmail(toEmail));
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email] Sent (${context}):`, {
      messageId: info?.messageId,
      response: info?.response
    });
    return info;
  } catch (error) {
    console.error(`[Email] Send failed (${context}):`, {
      message: error?.message,
      code: error?.code,
      command: error?.command,
      response: error?.response,
      responseCode: error?.responseCode
    });
    throw error;
  }
};

// Send verification code email
const sendVerificationEmail = async (toEmail, code) => {
  try {
    const info = await sendMail({
      toEmail,
      subject: 'Email Verification Code - KLSB Timesheet',
      context: 'verification',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #030C69 0%, #1a2d9e 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">KLSB Timesheet</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Email Verification</h2>
            <p style="color: #666; font-size: 16px;">You requested to change your email address. Use the verification code below:</p>
            
            <div style="background: white; padding: 20px; text-align: center; border-radius: 8px; margin: 30px 0;">
              <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #030C69; font-family: monospace;">
                ${code}
              </div>
            </div>
            
            <p style="color: #666; font-size: 14px;">This code will expire in <strong>10 minutes</strong>.</p>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">If you didn't request this, please ignore this email.</p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>© 2025 KLSB Timesheet Management System</p>
          </div>
        </div>
      `
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error);
    throw new Error('Failed to send email');
  }
};

// Send password reset code email
const sendPasswordResetEmail = async (toEmail, code) => {
  try {
    const info = await sendMail({
      toEmail,
      subject: 'Password Reset Code - KLSB Timesheet',
      context: 'password-reset',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #030C69 0%, #1a2d9e 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">KLSB Timesheet</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Password Reset</h2>
            <p style="color: #666; font-size: 16px;">Use the verification code below to reset your password:</p>
            
            <div style="background: white; padding: 20px; text-align: center; border-radius: 8px; margin: 30px 0;">
              <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #030C69; font-family: monospace;">
                ${code}
              </div>
            </div>
            
            <p style="color: #666; font-size: 14px;">This code will expire in <strong>10 minutes</strong>.</p>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">If you didn't request this, please ignore this email.</p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>© 2025 KLSB Timesheet Management System</p>
          </div>
        </div>
      `
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Password reset email send error:', error);
    throw new Error('Failed to send password reset email');
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail
};
