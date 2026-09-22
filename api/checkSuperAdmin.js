const { verifyIdToken } = require("./_lib/firebaseAdmin");
const { enforceRateLimit } = require("./_lib/rateLimit");

// GovernmentRegister needs to know whether the signed-in user is the
// designated super-admin so it can show the one-time seed-admin command -
// but SUPER_ADMIN_EMAIL itself must never reach the browser (a VITE_-
// prefixed env var ships in the client bundle for anyone to read). This
// endpoint does the comparison server-side and returns only a boolean.
module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const decodedToken = await verifyIdToken(req.headers.authorization);
    await enforceRateLimit({ uid: decodedToken.uid, action: "checkSuperAdmin", max: 20, windowMs: 60_000 });

    const configured = (process.env.SUPER_ADMIN_EMAIL || "").trim().toLowerCase();
    const callerEmail = (decodedToken.email || "").toLowerCase();
    const isSuperAdmin = Boolean(configured) && callerEmail === configured;

    res.status(200).json({ isSuperAdmin });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || "Check failed." });
  }
};
