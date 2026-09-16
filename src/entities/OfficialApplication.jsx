import { db, auth } from "../firebase";
import { doc, getDoc, setDoc, collection, query, where, orderBy, getDocs, serverTimestamp } from "firebase/firestore";

// Approving/rejecting/revoking is done via scripts/admin-cli.js (run locally
// with a service-account key) rather than from the browser - see
// docs/SECURITY.md. Firestore rules refuse any client-side write to an
// application's status field regardless, so there's no client method for it
// here; this module only reads and submits.
export const OfficialApplication = {
  async submit({ full_name, department, employee_id, phone_number, document_public_id, document_resource_type }) {
    const user = auth.currentUser;
    if (!user) throw new Error("Not authenticated");

    await setDoc(doc(db, "officialApplications", user.uid), {
      uid: user.uid,
      full_name,
      department,
      employee_id,
      phone_number,
      email: user.email,
      document_public_id: document_public_id || null,
      document_resource_type: document_resource_type || null,
      status: "pending",
      submitted_at: serverTimestamp(),
    });
  },

  async getMine() {
    const user = auth.currentUser;
    if (!user) return null;
    const snap = await getDoc(doc(db, "officialApplications", user.uid));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },

  async listPending() {
    const q = query(
      collection(db, "officialApplications"),
      where("status", "==", "pending"),
      orderBy("submitted_at", "asc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  async listAll() {
    const q = query(collection(db, "officialApplications"), orderBy("submitted_at", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },
};
