const nodemailer = require('nodemailer');

function createTransport() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_EMAIL;
  const pass = process.env.SMTP_PASSWORD;
  const port = Number(process.env.SMTP_PORT || 587);

  if (!host || !user || !pass) {
    throw new Error('SMTP configuration is missing');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });
}

async function sendEmailVerification({ to, token }) {
  const baseUrl = process.env.APP_BASE_URL || 'http://localhost:5173';
  const verifyUrl = `${baseUrl}/api/users/verify-email?token=${encodeURIComponent(token)}`;

  const transporter = createTransport();
  await transporter.sendMail({
    from: process.env.SMTP_EMAIL,
    to,
    subject: 'Verify your email',
    html: `<p>Please verify your email by clicking the link below:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`
  });
}

async function sendInvitationEmail({ to, role, tempPassword, adminName }) {
  const baseUrl = process.env.APP_BASE_URL || 'http://localhost:5173';
  const loginUrl = `${baseUrl}/login`;

  const transporter = createTransport();
  await transporter.sendMail({
    from: process.env.SMTP_EMAIL,
    to,
    subject: `Invitation to join Chrome Accountants as ${role}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #122A44;">Welcome to Chrome Accountants!</h2>
        <p>Hello,</p>
        <p>You have been invited by ${adminName} to join Chrome Accountants as a <strong>${role}</strong>.</p>
        <p>Your temporary login credentials are:</p>
        <ul>
          <li><strong>Email:</strong> ${to}</li>
          <li><strong>Password:</strong> ${tempPassword}</li>
        </ul>
        <p>Please log in using these credentials and change your password on first login.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${loginUrl}" style="background-color: #FCB426; color: #122A44; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Login to Your Account</a>
        </div>
        <p>If you have any questions, please contact our support team.</p>
        <p>Best regards,<br>Chrome Accountants Team</p>
      </div>
    `
  });
}

async function sendPasswordResetEmail({ to, resetToken }) {
  const baseUrl = process.env.APP_BASE_URL || 'http://localhost:5173';
  const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;

  const transporter = createTransport();
  await transporter.sendMail({
    from: process.env.SMTP_EMAIL,
    to,
    subject: 'Password Reset Request - Chrome Accountants',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #122A44;">Password Reset Request</h2>
        <p>Hello,</p>
        <p>We received a request to reset your password for your Chrome Accountants account.</p>
        <p>If you made this request, click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #FCB426; color: #122A44; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p>This link will expire in 1 hour for security reasons.</p>
        <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
        <p>For security reasons, if you continue to receive these emails, please contact our support team.</p>
        <p>Best regards,<br>Chrome Accountants Team</p>
      </div>
    `
  });
}

async function sendLoginCodeEmail({ to, loginCode }) {
  const transporter = createTransport();
  await transporter.sendMail({
    from: process.env.SMTP_EMAIL,
    to,
    subject: 'Your Chrome Accountants Login Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #122A44;">Your Login Code</h2>
        <p>Hello,</p>
        <p>You requested a login code for your Chrome Accountants account. Use the code below to sign in:</p>
        <div style="text-align: center; margin: 30px 0;">
          <div style="background-color: #122A44; color: #FCB426; padding: 20px; border-radius: 12px; font-size: 32px; font-weight: bold; letter-spacing: 4px; display: inline-block; min-width: 200px;">
            ${loginCode}
          </div>
        </div>
        <p style="text-align: center; color: #666; font-size: 14px;">This code will expire in 10 minutes for security reasons.</p>
        <p>If you didn't request this login code, please ignore this email and contact our support team if you continue to receive these emails.</p>
        <p>Best regards,<br>Chrome Accountants Team</p>
      </div>
    `
  });
}

async function sendContactFormEmail(user, formData, pdfBuffer) {
  const transporter = createTransport();
  
  const clientName = `${formData.personalDetails?.firstName || ''} ${formData.personalDetails?.lastName || ''}`.trim();
  const subject = `New Client Contact Form Submission - ${clientName}`;
  
  await transporter.sendMail({
    from: process.env.SMTP_EMAIL,
    to: 'faiyazshammo@gmail.com', // Send to test email for now
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #122A44;">New Client Contact Form Submission</h2>
        <p>Hello Chrome Accountants Team,</p>
        <p>A new client contact form has been submitted by <strong>${clientName}</strong> (${user.email}).</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #122A44; margin-top: 0;">Form Summary:</h3>
          <p><strong>Client:</strong> ${clientName}</p>
          <p><strong>Email:</strong> ${formData.contactInfo?.email || user.email}</p>
          <p><strong>Phone:</strong> ${formData.contactInfo?.mobilePhone || 'Not provided'}</p>
          <p><strong>Submission Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        
        <p>The complete form details are attached as a PDF document.</p>
        <p>Please review the submission and follow up with the client as needed.</p>
        
        <p>Best regards,<br>Chrome Accountants System</p>
      </div>
    `,
    attachments: [
      {
        filename: `Client_Contact_Form_${clientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }
    ]
  });
}

module.exports = { 
  sendEmailVerification, 
  sendInvitationEmail, 
  sendPasswordResetEmail,
  sendLoginCodeEmail,
  sendContactFormEmail 
};


