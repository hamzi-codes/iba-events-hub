const nodemailer = require('nodemailer');
const env = require('../config/env');

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: { user: env.smtp.user, pass: env.smtp.pass },
    });
  }
  return transporter;
}

// EMAIL_MODE=console prints the code in the server log (development only).
// EMAIL_MODE=smtp sends a real email and never logs the code.
async function sendVerificationCode(to, code) {
  if (env.emailMode === 'console') {
    console.log(`[email:console] Verification code for ${to}: ${code}`);
    return;
  }

  await getTransporter().sendMail({
    from: env.smtp.from,
    to,
    subject: 'Your IBA Events Hub verification code',
    text:
      `Your verification code is ${code}.\n` +
      'It is valid for 24 hours. If you did not sign up for IBA Events Hub, ignore this email.',
  });
}

module.exports = { sendVerificationCode };