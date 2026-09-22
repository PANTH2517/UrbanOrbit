const { admin, getAdminApp } = require("./_lib/firebaseAdmin");
const { enforceRateLimit } = require("./_lib/rateLimit");
const { sendOtpEmail } = require("./_lib/mailer");

const OTP_TTL_MS = 10 * 60_000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Vercel serverless function - first half of citizen sign-in. Deliberately
// takes no Authorization header: this is how a citizen first identifies
// themselves (passwordless - just an email + a code), so there's no session
// yet to check. Creates the Firebase Auth user on first use if one doesn't
// already exist for this email (no password is ever set - see
// api/verifyOtp.js for how sign-in actually completes via a custom token).
module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { email } = req.body || {};
    if (!email || !EMAIL_PATTERN.test(email)) {
      res.status(400).json({ error: "A valid email address is required." });
      return;
    }
    const normalizedEmail = email.trim().toLowerCase();

    const app = getAdminApp();
    let user;
    try {
      user = await admin.auth(app).getUserByEmail(normalizedEmail);
    } catch {
      user = await admin.auth(app).createUser({ email: normalizedEmail });
    }

    // Keyed by the resolved account, not the raw request, so repeated
    // attempts against the same citizen are what's actually throttled -
    // matches every other rate limit in this codebase.
    await enforceRateLimit({ uid: user.uid, action: "sendOtp", max: 3, windowMs: OTP_TTL_MS });

    const otp = String(Math.floor(100000 + Math.random() * 900000)); // 6 digits

    await admin
      .firestore(app)
      .collection("otpSessions")
      .doc(user.uid)
      .set({
        otp,
        expires_at: Date.now() + OTP_TTL_MS,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
      });

    await sendOtpEmail(normalizedEmail, otp);

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || "Could not send verification code." });
  }
};
