import { useState } from "react";
import "../css/ScanInput.css";

export default function ScanInput({ onSubmit, status, disabled }) {
  const [value, setValue] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const code = value.trim();
    if (!code) return;
    setValue("");
    onSubmit(code);
  };

  return (
    <div className="scan">
      <div className={`scan-state ${disabled ? "scan-state-off" : "scan-state-on"}`}>
        <span className="scan-dot" />
        {disabled ? "Scanner paused" : "Scanner ready - scan a product"}
      </div>

      {status && (
        <p className={`scan-status scan-status-${status.type}`} role="status">
          {status.text}
        </p>
      )}

      <form onSubmit={handleSubmit} className="scan-form">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Or type a barcode and press Enter"
          disabled={disabled}
          className="scan-input"
        />
        <button type="submit" disabled={disabled} className="btn">
          Add
        </button>
      </form>
    </div>
  );
}