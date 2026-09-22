import { auth, db } from "../firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, limit, onSnapshot } from "firebase/firestore";

export class Issue {
  static async list() {
    try {
      const q = query(collection(db, "issues"), orderBy("created_date", "desc"));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
    } catch (e) {
      console.error("Error listing issues:", e);
      return [];
    }
  }

  static async getAllIssues() {
    return await this.list();
  }

  /**
   * Live-subscribes to the most recent issues (public read, matches
   * firestore.rules). Returns an unsubscribe function. Powers the activity
   * feed - updates as soon as a new report or status change is written,
   * no polling.
   */
  static subscribeRecent(callback, { max = 8 } = {}) {
    const q = query(collection(db, "issues"), orderBy("created_date", "desc"), limit(max));
    return onSnapshot(
      q,
      (snapshot) => {
        callback(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })));
      },
      (err) => {
        console.error("Error subscribing to issues:", err);
      }
    );
  }

  static async create(data) {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("Please sign in before reporting an issue.");
    }

    try {
      const payload = {
        ...data,
        created_date: new Date().toISOString(),
        status: "pending",
        created_by: user.uid,
        created_by_email: user.email,
      };
      const docRef = await addDoc(collection(db, "issues"), payload);
      return { id: docRef.id, ...payload };
    } catch (e) {
      console.error("Error creating issue:", e);
      throw e;
    }
  }

  static async update(id, data) {
    try {
      const issueRef = doc(db, "issues", id);
      const payload = { ...data };
      // Stamp resolution time automatically so reporting can compute real
      // resolution-time metrics instead of leaving resolved_date empty forever.
      if (payload.status === "completed") {
        payload.resolved_date = new Date().toISOString();
      } else if (payload.status && payload.status !== "completed") {
        payload.resolved_date = null;
      }
      await updateDoc(issueRef, payload);
      return true;
    } catch (e) {
      console.error("Error updating issue:", e);
      throw e;
    }
  }

  /** Admin-only per firestore.rules (allow delete: if isAdmin()) - for
   * removing a mistakenly-created report. Firestore rejects this call
   * outright for anyone else, regardless of what the UI shows. */
  static async delete(id) {
    try {
      await deleteDoc(doc(db, "issues", id));
      return true;
    } catch (e) {
      console.error("Error deleting issue:", e);
      throw e;
    }
  }
}
