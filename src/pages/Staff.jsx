import { useEffect, useState } from "react";
import {
  roleLabel,
  listStaff,
  createSaler,
  updateSaler,
  setSalerActive,
  sendStaffReset,
} from "../services/userService";
import "../css/Staff.css";

function SalerForm({ saler, onSubmit, onCancel }) {
  const isEdit = Boolean(saler);
  const [values, setValues] = useState({
    name: saler?.name || "",
    email: saler?.email || "",
    password: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await onSubmit(values);
    } catch (err) {
      setError(err.message || "Could not save.");
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="staff-form">
      <label className="staff-label">
        Full name
        <input
          name="name"
          value={values.name}
          onChange={handleChange}
          autoFocus
          required
          className="staff-input"
        />
      </label>

      <label className="staff-label">
        Email (used to sign in)
        <input
          name="email"
          type="email"
          value={values.email}
          onChange={handleChange}
          disabled={isEdit}
          required
          className="staff-input"
        />
      </label>

      {!isEdit && (
        <label className="staff-label">
          Temporary password
          <input
            name="password"
            type="text"
            value={values.password}
            onChange={handleChange}
            minLength={6}
            required
            className="staff-input"
          />
          <span className="staff-hint">
            Give this to the saler. They can set their own with "Forgot
            password" on the login page.
          </span>
        </label>
      )}

      {error && (
        <p className="staff-error" role="alert">
          {error}
        </p>
      )}

      <div className="staff-actions">
        <button type="submit" disabled={busy} className="btn btn-primary">
          {busy ? "Saving..." : isEdit ? "Save changes" : "Create saler"}
        </button>
        <button type="button" onClick={onCancel} className="btn">
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function Staff() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null); // { type, text }
  const [modal, setModal] = useState(null); // { mode: "add" } or { mode: "edit", saler }
  const [busyId, setBusyId] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    listStaff()
      .then((data) => {
        if (active) {
          setStaff(data);
          setError("");
        }
      })
      .catch((err) => {
        console.error(err);
        if (active) setError("Could not load staff.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const reload = () => setReloadKey((k) => k + 1);

  const handleSave = async (data) => {
    if (modal.mode === "add") {
      await createSaler(data);
      setNotice({ type: "ok", text: `Saler account created for ${data.name.trim()}.` });
    } else {
      await updateSaler(modal.saler.id, data);
      setNotice({ type: "ok", text: `${data.name.trim()} was updated.` });
    }
    setModal(null);
    reload();
  };

  const toggleActive = async (s) => {
    const deactivating = s.active !== false;
    if (
      deactivating &&
      !window.confirm(`Deactivate ${s.name}? They will not be able to sign in.`)
    ) {
      return;
    }

    setBusyId(s.id);
    try {
      await setSalerActive(s.id, !deactivating);
      setNotice({
        type: "ok",
        text: `${s.name} was ${deactivating ? "deactivated" : "reactivated"}.`,
      });
      reload();
    } catch (err) {
      console.error(err);
      setNotice({ type: "error", text: "Could not update the account." });
    } finally {
      setBusyId("");
    }
  };

  const resetPassword = async (s) => {
    if (!window.confirm(`Send a password reset email to ${s.email}?`)) return;
    setBusyId(s.id);
    try {
      await sendStaffReset(s.email);
      setNotice({ type: "ok", text: `Password reset email sent to ${s.email}.` });
    } catch (err) {
      console.error(err);
      setNotice({ type: "error", text: "Could not send the reset email." });
    } finally {
      setBusyId("");
    }
  };

  return (
    <div>
      <div className="staff-head">
        <h1 className="page-title staff-title">Staff</h1>
        <button onClick={() => setModal({ mode: "add" })} className="btn btn-primary">
          + Add saler
        </button>
      </div>

      {notice && (
        <p className={`staff-notice staff-notice-${notice.type}`} role="status">
          {notice.text}
        </p>
      )}
      {error && <p className="msg-error">{error}</p>}
      {loading && staff.length === 0 && <p className="msg-muted">Loading staff...</p>}

      {staff.length > 0 && (
        <div className="table-wrap card">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => {
                const isActive = s.active !== false;
                const isSaler = s.role === "saler";
                return (
                  <tr key={s.id} className={isActive ? "" : "staff-row-off"}>
                    <td>{s.name}</td>
                    <td>{s.email}</td>
                    <td>{roleLabel(s.role)}</td>
                    <td>
                      <span
                        className={`staff-badge ${
                          isActive ? "staff-badge-on" : "staff-badge-off"
                        }`}
                      >
                        {isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="staff-row-actions">
                      {isSaler ? (
                        <>
                          <button
                            className="btn"
                            disabled={busyId === s.id}
                            onClick={() => setModal({ mode: "edit", saler: s })}
                          >
                            Edit
                          </button>
                          <button
                            className="btn"
                            disabled={busyId === s.id}
                            onClick={() => resetPassword(s)}
                          >
                            Reset password
                          </button>
                          <button
                            className={isActive ? "btn btn-danger" : "btn"}
                            disabled={busyId === s.id}
                            onClick={() => toggleActive(s)}
                          >
                            {isActive ? "Deactivate" : "Reactivate"}
                          </button>
                        </>
                      ) : (
                        <span className="staff-muted">Managed in Firebase</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="staff-overlay" onClick={() => setModal(null)}>
          <div className="staff-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="staff-modal-title">
              {modal.mode === "edit" ? `Edit: ${modal.saler.name}` : "Add saler"}
            </h2>
            <SalerForm
              key={modal.mode === "edit" ? modal.saler.id : "new"}
              saler={modal.mode === "edit" ? modal.saler : undefined}
              onSubmit={handleSave}
              onCancel={() => setModal(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}