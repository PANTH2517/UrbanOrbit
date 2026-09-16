#!/usr/bin/env node
/**
 * Local admin CLI - replaces the approve/reject/revoke/seed-admin actions that
 * would otherwise be Firebase Cloud Functions. Runs on your own machine using
 * the Firebase Admin SDK, so it never needs the Blaze billing plan.
 *
 * Setup (one-time):
 *   1. Firebase console -> Project settings -> Service accounts ->
 *      "Generate new private key". Save the downloaded file as
 *      serviceAccountKey.json in the project root (it's already gitignored -
 *      never commit it).
 *   2. Run commands from the project root, e.g.:
 *        node scripts/admin-cli.js list-pending
 *        node scripts/admin-cli.js approve <uid>
 *        node scripts/admin-cli.js reject <uid> "reason (optional)"
 *        node scripts/admin-cli.js revoke <uid>
 *        node scripts/admin-cli.js seed-admin someone@example.com
 */
const path = require("path");
const fs = require("fs");
const admin = require("firebase-admin");

function initAdmin() {
  const keyPath = path.join(__dirname, "..", "serviceAccountKey.json");
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp({ credential: admin.credential.applicationDefault() });
  } else if (fs.existsSync(keyPath)) {
    admin.initializeApp({ credential: admin.credential.cert(require(keyPath)) });
  } else {
    console.error(
      "No credentials found. Either set GOOGLE_APPLICATION_CREDENTIALS, or place a\n" +
        "downloaded service-account key at serviceAccountKey.json in the project root.\n" +
        "(Firebase console -> Project settings -> Service accounts -> Generate new private key)"
    );
    process.exit(1);
  }
}

async function logAudit(db, { action, target, details }) {
  await db.collection("auditLog").add({
    action,
    actor_uid: "local-admin-cli",
    actor_email: process.env.USER || process.env.USERNAME || "local-admin-cli",
    target: target || null,
    details: details || null,
    created_at: admin.firestore.FieldValue.serverTimestamp(),
  });
}

async function listPending(db) {
  const snap = await db.collection("officialApplications").where("status", "==", "pending").get();
  if (snap.empty) {
    console.log("No pending applications.");
    return;
  }
  snap.forEach((doc) => {
    const d = doc.data();
    console.log(`- ${doc.id}  ${d.full_name} <${d.email}>  ${d.department}  (employee id: ${d.employee_id})`);
  });
}

async function approve(db, uid) {
  const appRef = db.collection("officialApplications").doc(uid);
  const appSnap = await appRef.get();
  if (!appSnap.exists) throw new Error(`No application found for uid ${uid}`);

  const user = await admin.auth().getUser(uid);
  await admin.auth().setCustomUserClaims(uid, { ...(user.customClaims || {}), role: "government_official" });
  await appRef.update({ status: "approved", reviewed_at: admin.firestore.FieldValue.serverTimestamp() });
  await logAudit(db, { action: "approve_official_application", target: uid });
  console.log(`Approved ${uid} (${user.email}). They may need to sign out/in to pick up the new role.`);
}

async function reject(db, uid, reason) {
  const appRef = db.collection("officialApplications").doc(uid);
  const appSnap = await appRef.get();
  if (!appSnap.exists) throw new Error(`No application found for uid ${uid}`);

  await appRef.update({
    status: "rejected",
    rejection_reason: reason || "",
    reviewed_at: admin.firestore.FieldValue.serverTimestamp(),
  });
  await logAudit(db, { action: "reject_official_application", target: uid, details: reason || null });
  console.log(`Rejected ${uid}.`);
}

async function revoke(db, uid) {
  const user = await admin.auth().getUser(uid);
  const claims = { ...(user.customClaims || {}) };
  delete claims.role;
  await admin.auth().setCustomUserClaims(uid, claims);
  await db.collection("officialApplications").doc(uid).update({
    status: "revoked",
    reviewed_at: admin.firestore.FieldValue.serverTimestamp(),
  });
  await logAudit(db, { action: "revoke_official_access", target: uid });
  console.log(`Revoked official access for ${uid} (${user.email}).`);
}

async function seedAdmin(db, email) {
  const user = await admin.auth().getUserByEmail(email);
  await admin.auth().setCustomUserClaims(user.uid, { ...(user.customClaims || {}), role: "admin" });
  await logAudit(db, { action: "seed_admin", target: user.uid, details: email });
  console.log(`${email} (${user.uid}) is now an admin. They may need to sign out/in to pick it up.`);
}

async function main() {
  const [, , command, ...args] = process.argv;
  initAdmin();
  const db = admin.firestore();

  try {
    switch (command) {
      case "list-pending":
        await listPending(db);
        break;
      case "approve":
        if (!args[0]) throw new Error("Usage: approve <uid>");
        await approve(db, args[0]);
        break;
      case "reject":
        if (!args[0]) throw new Error("Usage: reject <uid> [reason]");
        await reject(db, args[0], args.slice(1).join(" "));
        break;
      case "revoke":
        if (!args[0]) throw new Error("Usage: revoke <uid>");
        await revoke(db, args[0]);
        break;
      case "seed-admin":
        if (!args[0]) throw new Error("Usage: seed-admin <email>");
        await seedAdmin(db, args[0]);
        break;
      default:
        console.log(
          "Usage: node scripts/admin-cli.js <list-pending|approve|reject|revoke|seed-admin> [args]"
        );
    }
  } catch (err) {
    console.error("Error:", err.message || err);
    process.exit(1);
  }
  process.exit(0);
}

main();
