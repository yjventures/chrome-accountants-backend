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
  const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
  const verifyUrl = `${baseUrl}/api/users/verify-email?token=${encodeURIComponent(token)}`;

  const transporter = createTransport();
  await transporter.sendMail({
    from: process.env.SMTP_EMAIL,
    to,
    subject: 'Verify your email',
    html: `<p>Please verify your email by clicking the link below:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`
  });
}

module.exports = { sendEmailVerification };


