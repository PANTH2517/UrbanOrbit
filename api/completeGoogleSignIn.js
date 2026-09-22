const { verifyIdToken, admin, getAdminApp } = require("./_lib/firebaseAdmin");
const { enforceRateLimit } = require("./_lib/rateLimit");

// Vercel serverless function - called once, right after a citizen signs in
// with Google (signInWithPopup on the client). Unlike email-OTP sign-in,
// there IS already a session at this point (Google's own OAuth flow
// produced one), so this takes a normal Authorization header.
//
// Sets contact_verified: true immediately, with no OTP step - trusting
// decodedToken.firebase.sign_in_provider (embedded in the ID token by
// Firebase itself from the actual sign-in that happened, not something a
// client can set) rather than re-verifying anything ourselves. Google's own
// OAuth already proves the citizen controls that Google account, which is
// at least as strong a signal as our own email-OTP path - so this only
// upgrades trust for a sign-in Firebase itself attests really went through
// Google, never for a request merely claiming to be one.
module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const decodedToken = await verifyIdToken(req.headers.authorization);

    if (decodedToken.firebase?.sign_in_provider !== "google.com") {
      res.status(403).json({ error: "This endpoint is only for Google sign-ins." });
      return;
    }

    await enforceRateLimit({ uid: decodedToken.uid, action: "completeGoogleSignIn", max: 5, windowMs: 60_000 });

    const app = getAdminApp();
    const user = await admin.auth(app).getUser(decodedToken.uid);
    await admin.auth(app).setCustomUserClaims(decodedToken.uid, {
      ...(user.customClaims || {}),
      contact_verified: true,
    });

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || "Could not complete sign-in." });
  }
};
