import { getApp, initializeApp, deleteApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  deleteUser,
  signOut,
  sendPasswordResetEmail,
} from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../firebase";

const ROLE_LABELS = { admin: "Admin", saler: "Saler" };
export const roleLabel = (role) => ROLE_LABELS[role] || role;

function cleanName(value) {
  const name = String(value || "").trim();
  if (!name) throw new Error("Name is required.");
  return name;
}

export async function listStaff() {
  const snap = await getDocs(collection(db, "users"));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
}

// Admins can only create salers.
export async function createSaler({ name, email, password }) {
  const cleanEmail = String(email || "").trim().toLowerCase();
  if (!cleanEmail) throw new Error("Email is required.");
  if (String(password || "").length < 6) {
    throw new Error("The password must be at least 6 characters.");
  }
  const fullName = cleanName(name);

  // A temporary second connection, so the admin stays signed in.
  const secondaryApp = initializeApp(getApp().options, `saler-${Date.now()}`);
  const secondaryAuth = getAuth(secondaryApp);

  try {
    const cred = await createUserWithEmailAndPassword(
      secondaryAuth,
      cleanEmail,
      password
    );

    try {
      await setDoc(doc(db, "users", cred.user.uid), {
        name: fullName,
        email: cleanEmail,
        role: "saler",
        active: true,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      // No profile means no access, so remove the login we just made.
      await deleteUser(cred.user).catch(() => {});
      throw err;
    }

    await signOut(secondaryAuth);
    return cred.user.uid;
  } catch (err) {
    if (err.code === "auth/email-already-in-use") {
      throw new Error("An account with this email already exists.");
    }
    if (err.code === "auth/invalid-email") {
      throw new Error("Enter a valid email address.");
    }
    if (err.code === "auth/weak-password") {
      throw new Error("The password is too weak. Use at least 6 characters.");
    }
    if (err.code === "permission-denied") {
      throw new Error("You do not have permission to create saler accounts.");
    }
    throw err;
  } finally {
    await deleteApp(secondaryApp).catch(() => {});
  }
}

export async function updateSaler(uid, { name }) {
  await updateDoc(doc(db, "users", uid), {
    name: cleanName(name),
    updatedAt: serverTimestamp(),
  });
}

export async function setSalerActive(uid, active) {
  await updateDoc(doc(db, "users", uid), {
    active: Boolean(active),
    updatedAt: serverTimestamp(),
  });
}

export function sendStaffReset(email) {
  return sendPasswordResetEmail(auth, email);
}