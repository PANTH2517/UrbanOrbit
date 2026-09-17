const { verifyIdToken, admin, getAdminApp } = require("./_lib/firebaseAdmin");
const { enforceRateLimit } = require("./_lib/rateLimit");
const { sendOtp } = require("./_lib/twoFactor");

const E164_PATTERN = /^\+[1-9]\d{7,14}$/;

// Vercel serverless function - first half of citizen phone verification via
// 2Factor (see api/_lib/twoFactor.js for why: Firebase Phone Auth needs the
// Blaze billing plan to send real SMS, which this project avoids
// everywhere). Requires an existing signed-in Firebase user (citizens create
// their email/password account first, then verify phone) - this never
// creates an account itself.
module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const decodedToken = await verifyIdToken(req.headers.authorization);

    const { phone } = req.body || {};
    if (!phone || !E164_PATTERN.test(phone)) {
      res.status(400).json({ error: "A valid phone number in E.164 format is required." });
      return;
    }

    // SMS costs real money per send - 3/10min is generous for a real user
    // (who needs at most one, maybe a resend) and blunts abuse.
    await enforceRateLimit({ uid: decodedToken.uid, action: "sendOtp", max: 3, windowMs: 10 * 60_000 });

    const sessionId = await sendOtp(phone);

    // Stored server-side (never sent to the client) so verifyOtp.js looks up
    // which phone/session this uid is actually mid-verification for, rather
    // than trusting the client to echo back an unmodified session id.
    const app = getAdminApp();
    await admin
      .firestore(app)
      .collection("otpSessions")
      .doc(decodedToken.uid)
      .set({ phone, session_id: sessionId, created_at: admin.firestore.FieldValue.serverTimestamp() });

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || "Could not send OTP." });
  }
};
