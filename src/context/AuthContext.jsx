import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null); // { name, email, role, active }
  const [authError, setAuthError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        const snap = await getDoc(doc(db, "users", u.uid));

        if (!snap.exists()) {
          setAuthError(
            "Your account is not set up yet. Please contact the administrator."
          );
          await signOut(auth);
        } else if (snap.data().active === false) {
          setAuthError(
            "This account has been deactivated. Please contact the administrator."
          );
          await signOut(auth);
        } else {
          setAuthError("");
          setProfile(snap.data());
          setUser(u);
        }
      } catch (err) {
        console.error("Could not load user profile:", err);
        setAuthError(
          "Could not load your account. Check your connection and try again."
        );
        await signOut(auth);
      }

      setLoading(false);
    });
    return unsub;
  }, []);

  const login = (email, password) => {
    setAuthError("");
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => signOut(auth);

  const resetPassword = (email) => sendPasswordResetEmail(auth, email);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role: profile?.role,
        authError,
        login,
        logout,
        resetPassword,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}