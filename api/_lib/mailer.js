const nodemailer = require("nodemailer");

// Sends the citizen-verification OTP by email via Gmail SMTP - genuinely
// free (Gmail's ~500/day sending limit is far more than this app's citizen-
// verification volume needs), and reuses a Gmail account you likely already
// have rather than requiring yet another third-party service signup.
//
// GMAIL_APP_PASSWORD is NOT your regular Gmail password - Google requires
// 2-Step Verification enabled on the account, then a 16-character App
// Password generated at myaccount.google.com/apppasswords (App: Mail,
// Device: Other). Your regular password won't work here and Google will
// reject the login attempt.
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    throw new Error("GMAIL_USER / GMAIL_APP_PASSWORD are not set - see .env.example.");
  }
  transporter = nodemailer.createTransport({ service: "gmail", auth: { user, pass } });
  return transporter;
}

async function sendOtpEmail(to, otp) {
  const user = process.env.GMAIL_USER;
  await getTransporter().sendMail({
    from: `UrbanOrbit <${user}>`,
    to,
    subject: `${otp} is your UrbanOrbit verification code`,
    text: `Your UrbanOrbit verification code is ${otp}. It expires in 10 minutes. If you didn't request this, you can ignore this email.`,
    html: `<p>Your UrbanOrbit verification code is:</p><p style="font-size:28px;font-weight:bold;letter-spacing:4px;">${otp}</p><p>It expires in 10 minutes. If you didn't request this, you can ignore this email.</p>`,
  });
}

module.exports = { sendOtpEmail };
