import { auth, db } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

let authReadyPromise = null;

// Firebase restores a persisted session asynchronously, so auth.currentUser can
// be momentarily null on first load even for a signed-in user. Wait for the
// first onAuthStateChanged tick to get a definitive answer.
function waitForAuthInit() {
  if (!authReadyPromise) {
    authReadyPromise = new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        resolve(user);
      });
    });
  }
  return authReadyPromise;
}

async function buildUserRecord(firebaseUser, { forceRefresh = false } = {}) {
  const tokenResult = await firebaseUser.getIdTokenResult(forceRefresh);
  const role = tokenResult.claims.role || null;
  // Phone verification goes through 2Factor.in (api/sendOtp.js /
  // api/verifyOtp.js), not Firebase Phone Auth - see docs/SECURITY.md for
  // why. api/verifyOtp.js sets these as custom claims via the Admin SDK on
  // a correct OTP, the same trust pattern already used for role.
  const phoneVerified = tokenResult.claims.phone_verified === true;
  const phoneNumber = tokenResult.claims.phone_number || null;

  let profile = {};
  try {
    const snap = await getDoc(doc(db, "users", firebaseUser.uid));
    if (snap.exists()) profile = snap.data();
  } catch {
    // Firestore profile is best-effort display data; auth/claims remain authoritative.
  }

  return {
    ...profile,
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    full_name: profile.full_name || firebaseUser.displayName || firebaseUser.email,
    phone_number: phoneNumber || profile.phone_number || null,
    phone_verified: phoneVerified,
    role,
    user_type: role === "admin" ? "admin" : role === "government_official" ? "government_official" : "citizen",
  };
}

export const User = {
  async me() {
    const firebaseUser = await waitForAuthInit();
    if (!firebaseUser) {
      throw new Error("Not authenticated");
    }
    return buildUserRecord(firebaseUser);
  },

  /** Forces a fresh ID token (e.g. right after an admin approves an official account). */
  async refresh() {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) throw new Error("Not authenticated");
    return buildUserRecord(firebaseUser, { forceRefresh: true });
  },

  async logout() {
    await signOut(auth);
  },

  /** Subscribes to auth state changes; returns an unsubscribe function. */
  onChange(callback) {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        callback(null);
        return;
      }
      try {
        callback(await buildUserRecord(firebaseUser));
      } catch {
        callback(null);
      }
    });
  },

  async upsertProfile(data) {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) throw new Error("Not authenticated");
    await setDoc(
      doc(db, "users", firebaseUser.uid),
      { ...data, updated_at: serverTimestamp() },
      { merge: true }
    );
  },
};
