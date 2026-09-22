const { verifyIdToken, admin, getAdminApp } = require("./_lib/firebaseAdmin");
const { enforceRateLimit } = require("./_lib/rateLimit");

// Vercel serverless function - second half of citizen identity verification
// (see api/sendOtp.js). On a correct, unexpired code, sets contact_verified
// as a custom claim via the Admin SDK - the same trust pattern already used
// for role - which firestore.rules then trusts (isVerifiedCitizen()) and a
// citizen can never forge by editing their own Firestore profile document.
module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const decodedToken = await verifyIdToken(req.headers.authorization);

    const { otp } = req.body || {};
    if (!otp || typeof otp !== "string" || !/^\d{6}$/.test(otp)) {
      res.status(400).json({ error: "A valid 6-digit code is required." });
      return;
    }

    // OTPs are short numeric codes - without a limit here, an attacker
    // could brute-force one in far fewer than 1,000,000 guesses.
    await enforceRateLimit({ uid: decodedToken.uid, action: "verifyOtp", max: 10, windowMs: 10 * 60_000 });

    const app = getAdminApp();
    const db = admin.firestore(app);
    const sessionRef = db.collection("otpSessions").doc(decodedToken.uid);
    const sessionSnap = await sessionRef.get();
    if (!sessionSnap.exists) {
      res.status(400).json({ error: "No pending verification for this account. Request a new code." });
      return;
    }

    const { otp: expectedOtp, expires_at } = sessionSnap.data();
    if (Date.now() > expires_at) {
      await sessionRef.delete();
      res.status(400).json({ error: "That code has expired. Request a new one." });
      return;
    }
    if (otp !== expectedOtp) {
      res.status(400).json({ error: "That code isn't right. Please try again." });
      return;
    }

    const user = await admin.auth(app).getUser(decodedToken.uid);
    await admin.auth(app).setCustomUserClaims(decodedToken.uid, {
      ...(user.customClaims || {}),
      contact_verified: true,
    });
    await sessionRef.delete();

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || "Verification failed." });
  }
};
