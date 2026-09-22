const { verifyIdToken, admin, getAdminApp } = require("./_lib/firebaseAdmin");
const { enforceRateLimit } = require("./_lib/rateLimit");
const { sendOtpEmail } = require("./_lib/mailer");

const OTP_TTL_MS = 10 * 60_000;

// Vercel serverless function - first half of citizen identity verification.
// Sends a code to the email address the citizen already signed up with
// (Firebase's own ID token - never client-supplied, so there's nothing to
// spoof here) via Gmail SMTP. This isn't SMS: real SMS costs money per send
// everywhere (Firebase Phone Auth requires the Blaze billing plan;
// dedicated SMS APIs charge directly), which this project avoids - see
// docs/SECURITY.md for the honest tradeoff this makes (email is a weaker
// anti-bot signal than a real phone number, but it's the genuinely free
// option). Requires an existing signed-in Firebase user (citizens create
// their email/password account first, then verify it) - this never creates
// an account itself.
module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const decodedToken = await verifyIdToken(req.headers.authorization);
    if (!decodedToken.email) {
      res.status(400).json({ error: "This account has no email address to verify." });
      return;
    }

    // Sending email is free, but still rate-limit against someone spamming
    // their own inbox (or, if this endpoint were ever abused, spamming
    // someone else's) via repeated requests.
    await enforceRateLimit({ uid: decodedToken.uid, action: "sendOtp", max: 3, windowMs: OTP_TTL_MS });

    const otp = String(Math.floor(100000 + Math.random() * 900000)); // 6 digits

    const app = getAdminApp();
    await admin
      .firestore(app)
      .collection("otpSessions")
      .doc(decodedToken.uid)
      .set({
        otp,
        expires_at: Date.now() + OTP_TTL_MS,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
      });

    await sendOtpEmail(decodedToken.email, otp);

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || "Could not send verification code." });
  }
};
