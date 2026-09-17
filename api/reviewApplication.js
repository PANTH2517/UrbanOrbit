const { verifyIdToken, admin, getAdminApp } = require("./_lib/firebaseAdmin");
const { enforceRateLimit } = require("./_lib/rateLimit");

// Vercel serverless function - does exactly what scripts/admin-cli.js's
// approve/reject/revoke commands do (same Admin SDK, same audit log entry),
// just running here instead of requiring the admin to have the project
// checked out locally with a service-account key on their own machine. The
// trust model is unchanged: only a caller whose Firebase ID token already
// carries the admin custom claim can reach this, and only the Admin SDK
// (never a client write) can change an application's status - see
// firestore.rules and docs/SECURITY.md.
module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const decodedToken = await verifyIdToken(req.headers.authorization);
    if (decodedToken.role !== "admin") {
      res.status(403).json({ error: "Admin access required." });
      return;
    }

    await enforceRateLimit({ uid: decodedToken.uid, action: "reviewApplication", max: 30, windowMs: 60_000 });

    const { uid, action, reason } = req.body || {};
    if (!uid || typeof uid !== "string") {
      res.status(400).json({ error: "uid is required." });
      return;
    }
    if (!["approve", "reject", "revoke"].includes(action)) {
      res.status(400).json({ error: "action must be one of: approve, reject, revoke." });
      return;
    }

    const app = getAdminApp();
    const db = admin.firestore(app);
    const appRef = db.collection("officialApplications").doc(uid);
    const appSnap = await appRef.get();
    if (!appSnap.exists) {
      res.status(404).json({ error: `No application found for uid ${uid}` });
      return;
    }

    // An admin account can end up with a leftover officialApplications
    // record from before it was made admin (e.g. it applied as an official
    // first). Approving/rejecting/revoking that record would silently
    // overwrite its role claim to government_official (approve) or strip
    // its role entirely (revoke) - never what's intended - so refuse it
    // outright rather than letting an admin accidentally demote themselves.
    const targetUser = await admin.auth(app).getUser(uid);
    if (targetUser.customClaims?.role === "admin") {
      res.status(400).json({ error: "This account is already an admin - its role can't be changed here." });
      return;
    }

    const auditEntry = {
      actor_uid: decodedToken.uid,
      actor_email: decodedToken.email || null,
      target: uid,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (action === "approve") {
      await admin.auth(app).setCustomUserClaims(uid, { ...(targetUser.customClaims || {}), role: "government_official" });
      await appRef.update({ status: "approved", reviewed_at: admin.firestore.FieldValue.serverTimestamp() });
      await db.collection("auditLog").add({ ...auditEntry, action: "approve_official_application", details: null });
    } else if (action === "reject") {
      await appRef.update({
        status: "rejected",
        rejection_reason: reason || "",
        reviewed_at: admin.firestore.FieldValue.serverTimestamp(),
      });
      await db.collection("auditLog").add({ ...auditEntry, action: "reject_official_application", details: reason || null });
    } else {
      const claims = { ...(targetUser.customClaims || {}) };
      delete claims.role;
      await admin.auth(app).setCustomUserClaims(uid, claims);
      await appRef.update({ status: "revoked", reviewed_at: admin.firestore.FieldValue.serverTimestamp() });
      await db.collection("auditLog").add({ ...auditEntry, action: "revoke_official_access", details: null });
    }

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || "Review action failed." });
  }
};
