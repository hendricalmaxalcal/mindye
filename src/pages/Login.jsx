import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { STORE } from "../config/store";
import "../css/Login.css";

function BarcodeIcon() {
  return (
    <svg
      className="login-logo-icon"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <rect x="2" y="4" width="2" height="16" />
      <rect x="6" y="4" width="1" height="16" />
      <rect x="9" y="4" width="3" height="16" />
      <rect x="14" y="4" width="1" height="16" />
      <rect x="17" y="4" width="2" height="16" />
      <rect x="21" y="4" width="1" height="16" />
    </svg>
  );
}

function friendlyError(err) {
  switch (err.code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Wrong email or password.";
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a few minutes and try again.";
    case "auth/network-request-failed":
      return "No internet connection. Check your network and try again.";
    case "auth/user-disabled":
      return "This account has been disabled.";

    // Setup problems (these point to Firebase settings, not the user)
    case "auth/operation-not-allowed":
    case "auth/configuration-not-found":
      return "Email/Password sign-in is not enabled in Firebase. Enable it under Authentication > Sign-in method.";
    case "auth/invalid-api-key":
    case "auth/api-key-not-valid.-please-pass-a-valid-api-key.":
      return "The Firebase API key in .env is not valid. Copy it again from Firebase project settings and restart the dev server.";
    case "auth/unauthorized-domain":
      return "This domain is not authorized. Add it under Authentication > Settings > Authorized domains.";

    default:
      // Shows the real code so the problem can be identified.
      return `Could not sign in (${err.code || err.message}).`;
  }
}

export default function Login() {
  const { user, authError, login, resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  // If AuthContext refused the account (not set up / deactivated), stop the spinner.
  useEffect(() => {
    if (authError) setBusy(false);
  }, [authError]);

  // Once the user and their role are loaded, go to the app.
  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setBusy(true);
    try {
      await login(email.trim(), password);
      // Redirect happens automatically once AuthContext has the user and role.
    } catch (err) {
      console.error("Login error:", err.code, err.message);
      setError(friendlyError(err));
      setBusy(false);
    }
  };

  const handleForgot = async () => {
    setError("");
    setInfo("");
    if (!email.trim()) {
      setError("Enter your email above first, then click Forgot password.");
      return;
    }
    setBusy(true);
    try {
      await resetPassword(email.trim());
    } catch (err) {
      if (err.code === "auth/invalid-email") {
        setError("Enter a valid email address.");
        setBusy(false);
        return;
      }
      if (err.code === "auth/network-request-failed") {
        setError("No internet connection. Check your network and try again.");
        setBusy(false);
        return;
      }
      // For any other error, show the same message so we don't reveal
      // whether an account exists for this email.
    }
    setInfo(
      "If an account exists for that email, a password reset link has been sent."
    );
    setBusy(false);
  };

  const shownError = error || authError;

  return (
    <div className="login-page">
      <aside className="login-brand">
        <div className="login-logo">
          <BarcodeIcon />
          <span>{STORE.name}</span>
        </div>

        <div className="login-brand-main">
          {!logoFailed && (
            <img
              src={STORE.logo}
              alt={`${STORE.name} logo`}
              className="login-brand-logo"
              onError={() => setLogoFailed(true)}
            />
          )}
          <h2 className="login-brand-title">Sell faster. Stock smarter.</h2>
          <p className="login-brand-text">
            Scan products at the till, receive new stock, and keep track of
            everything in one place.
          </p>
          <ul className="login-features">
            <li>Barcode scanning for sales</li>
            <li>Stock receiving and low-stock alerts</li>
            <li>Sales history and reports</li>
          </ul>
        </div>

        <div className="login-brand-footer">
          &copy; {new Date().getFullYear()} {STORE.name}
        </div>
      </aside>

      <main className="login-panel">
        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-mobile-logo">
            {logoFailed ? (
              <BarcodeIcon />
            ) : (
              <img
                src={STORE.logo}
                alt=""
                className="login-mobile-logo-img"
                onError={() => setLogoFailed(true)}
              />
            )}
            <span>{STORE.name}</span>
          </div>

          <h1 className="login-title">Welcome back</h1>
          <p className="login-subtitle">Sign in to your account</p>

          {shownError && (
            <p className="login-alert login-alert-error" role="alert">
              {shownError}
            </p>
          )}
          {info && (
            <p className="login-alert login-alert-info" role="status">
              {info}
            </p>
          )}

          <label htmlFor="email" className="login-label">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="login-input"
          />

          <label htmlFor="password" className="login-label">
            Password
          </label>
          <div className="login-password-row">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="login-input"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="login-toggle"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <div className="login-forgot-row">
            <button
              type="button"
              onClick={handleForgot}
              disabled={busy}
              className="login-link"
            >
              Forgot password?
            </button>
          </div>

          <button type="submit" disabled={busy} className="login-button">
            {busy ? "Please wait..." : "Login"}
          </button>
        </form>
      </main>
    </div>
  );
}