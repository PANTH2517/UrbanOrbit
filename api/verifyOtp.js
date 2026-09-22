const { admin, getAdminApp } = require("./_lib/firebaseAdmin");
const { enforceRateLimit } = require("./_lib/rateLimit");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Vercel serverless function - second half of citizen sign-in (see
// api/sendOtp.js). Also takes no Authorization header, for the same reason:
// the citizen doesn't have a session yet. On a correct, unexpired code it
// sets contact_verified as a custom claim via the Admin SDK - the same
// trust pattern already used for role - then mints a Firebase custom token
// so the client can actually sign in (signInWithCustomToken) without ever
// having set a password. firestore.rules' isVerifiedCitizen() then trusts
// that claim, which a citizen can never forge by editing their own
// Firestore profile document.
module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { email, otp } = req.body || {};
    if (!email || !EMAIL_PATTERN.test(email)) {
      res.status(400).json({ error: "A valid email address is required." });
      return;
    }
    if (!otp || typeof otp !== "string" || !/^\d{6}$/.test(otp)) {
      res.status(400).json({ error: "A valid 6-digit code is required." });
      return;
    }
    const normalizedEmail = email.trim().toLowerCase();

    const app = getAdminApp();
    let user;
    try {
      user = await admin.auth(app).getUserByEmail(normalizedEmail);
    } catch {
      res.status(400).json({ error: "No pending verification for this email. Request a new code." });
      return;
    }

    // OTPs are short numeric codes - without a limit here, an attacker
    // could brute-force one in far fewer than 1,000,000 guesses.
    await enforceRateLimit({ uid: user.uid, action: "verifyOtp", max: 10, windowMs: 10 * 60_000 });

    const db = admin.firestore(app);
    const sessionRef = db.collection("otpSessions").doc(user.uid);
    const sessionSnap = await sessionRef.get();
    if (!sessionSnap.exists) {
      res.status(400).json({ error: "No pending verification for this email. Request a new code." });
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

    await admin.auth(app).setCustomUserClaims(user.uid, {
      ...(user.customClaims || {}),
      contact_verified: true,
    });
    await sessionRef.delete();

    const customToken = await admin.auth(app).createCustomToken(user.uid);
    res.status(200).json({ success: true, customToken });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || "Verification failed." });
  }
};
