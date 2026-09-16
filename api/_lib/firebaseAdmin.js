const admin = require("firebase-admin");

// Vercel can't mount a service-account JSON file, so the key is stored as a
// single environment variable containing the full JSON (set in the Vercel
// project's Environment Variables settings - never commit it).
function getAdminApp() {
  if (admin.apps.length) return admin.apps[0];

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT env var is not set (paste the full service-account JSON as one Vercel env var)."
    );
  }

  const serviceAccount = JSON.parse(raw);
  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

/** Verifies the Firebase ID token from an Authorization: Bearer <token> header. */
async function verifyIdToken(authorizationHeader) {
  const app = getAdminApp();
  const match = /^Bearer (.+)$/.exec(authorizationHeader || "");
  if (!match) {
    const err = new Error("Missing Authorization: Bearer <idToken> header.");
    err.statusCode = 401;
    throw err;
  }
  try {
    return await admin.auth(app).verifyIdToken(match[1]);
  } catch {
    const err = new Error("Invalid or expired session. Please sign in again.");
    err.statusCode = 401;
    throw err;
  }
}

module.exports = { getAdminApp, verifyIdToken, admin };
