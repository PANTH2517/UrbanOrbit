const { getAdminApp, admin } = require("./firebaseAdmin");

// Vercel serverless functions are stateless between invocations (no shared
// in-memory store), so rate limiting has to live somewhere durable -
// Firestore, which every function here already has an Admin SDK connection
// to. This is a simple fixed-window counter per (uid, action): cheap to read
// (one doc get/set per call) and good enough to stop a compromised token or
// a runaway client from hammering the Gemini/Cloudinary quotas, without
// needing a separate Redis/Upstash account.
async function enforceRateLimit({ uid, action, max, windowMs }) {
  const app = getAdminApp();
  const db = admin.firestore(app);
  const windowKey = Math.floor(Date.now() / windowMs);
  const ref = db.collection("_rateLimits").doc(`${action}_${uid}_${windowKey}`);

  const count = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const current = snap.exists ? snap.data().count : 0;
    tx.set(
      ref,
      { count: current + 1, expiresAt: Date.now() + windowMs },
      { merge: true }
    );
    return current + 1;
  });

  if (count > max) {
    const err = new Error("Too many requests. Please slow down and try again shortly.");
    err.statusCode = 429;
    throw err;
  }
}

module.exports = { enforceRateLimit };
