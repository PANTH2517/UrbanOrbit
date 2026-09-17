const { verifyIdToken, admin, getAdminApp } = require("./_lib/firebaseAdmin");
const { enforceRateLimit } = require("./_lib/rateLimit");
const { verifyOtp } = require("./_lib/twoFactor");

// Vercel serverless function - second half of citizen phone verification via
// 2Factor. On a correct code, sets phone_verified/phone_number as custom
// claims on the caller's own Firebase user via the Admin SDK - the same
// trust pattern already used for role (government_official/admin): a claim
// only this server can set, which firestore.rules then trusts
// (isPhoneVerifiedCitizen()) without a citizen ever being able to forge it
// by editing their own Firestore profile document.
module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const decodedToken = await verifyIdToken(req.headers.authorization);

    const { otp } = req.body || {};
    if (!otp || typeof otp !== "string" || !/^\d{4,6}$/.test(otp)) {
      res.status(400).json({ error: "A valid OTP code is required." });
      return;
    }

    // OTPs are short numeric codes - without a limit here, an attacker
    // could brute-force one in far fewer than 10,000 guesses.
    await enforceRateLimit({ uid: decodedToken.uid, action: "verifyOtp", max: 10, windowMs: 10 * 60_000 });

    const app = getAdminApp();
    const db = admin.firestore(app);
    const sessionRef = db.collection("otpSessions").doc(decodedToken.uid);
    const sessionSnap = await sessionRef.get();
    if (!sessionSnap.exists) {
      res.status(400).json({ error: "No pending verification for this account. Request a new code." });
      return;
    }

    const { phone, session_id } = sessionSnap.data();
    const matched = await verifyOtp(session_id, otp);
    if (!matched) {
      res.status(400).json({ error: "That code isn't right or has expired. Please try again." });
      return;
    }

    const user = await admin.auth(app).getUser(decodedToken.uid);
    await admin.auth(app).setCustomUserClaims(decodedToken.uid, {
      ...(user.customClaims || {}),
      phone_verified: true,
      phone_number: phone,
    });
    await sessionRef.delete();

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || "Verification failed." });
  }
};
