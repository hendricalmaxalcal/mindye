import { useState } from "react";
import { ADJUST_REASONS } from "../services/stockService";
import "../css/AdjustStockForm.css";

export default function AdjustStockForm({ product, onSubmit, onCancel }) {
  const current = Number(product.stock) || 0;
  const [newQty, setNewQty] = useState("");
  const [reason, setReason] = useState("expired");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const qty = newQty === "" ? null : Number(newQty);
  const valid = qty !== null && Number.isInteger(qty) && qty >= 0;
  const diff = valid ? qty - current : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await onSubmit({ newQty: qty, reason, note });
    } catch (err) {
      setError(err.message || "Could not adjust the stock.");
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="asf-form">
      <div className="asf-current">
        Current stock: <strong>{current}</strong>
      </div>

      <label className="asf-label">
        Real quantity now on the shelf
        <input
          type="number"
          min="0"
          step="1"
          value={newQty}
          onChange={(e) => setNewQty(e.target.value)}
          autoFocus
          required
          className="asf-input"
        />
      </label>

      <button
        type="button"
        className="btn asf-zero"
        onClick={() => setNewQty("0")}
      >
        Write off everything (set to 0)
      </button>

      {diff !== null && diff !== 0 && (
        <p className={diff < 0 ? "asf-diff asf-diff-down" : "asf-diff asf-diff-up"}>
          This changes the stock by {diff > 0 ? "+" : ""}
          {diff} units.
        </p>
      )}

      <label className="asf-label">
        Reason
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="asf-input"
        >
          {ADJUST_REASONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </label>

      <label className="asf-label">
        Note (optional)
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="For example: batch expired on 30 Sep"
          className="asf-input"
        />
      </label>

      {error && (
        <p className="asf-error" role="alert">
          {error}
        </p>
      )}

      <div className="asf-actions">
        <button type="submit" disabled={busy || !valid} className="btn btn-primary">
          {busy ? "Saving..." : "Save adjustment"}
        </button>
        <button type="button" onClick={onCancel} className="btn">
          Cancel
        </button>
      </div>
    </form>
  );
}