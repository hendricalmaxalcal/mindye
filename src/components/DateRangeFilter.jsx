import { presetRange } from "../utils/dates";
import "../css/DateRangeFilter.css";

const PRESETS = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "last7", label: "Last 7 days" },
  { key: "month", label: "This month" },
];

// value: { from, to } as "YYYY-MM-DD". `children` appear on the right (extra filters).
export default function DateRangeFilter({ value, onChange, children }) {
  const activeKey = PRESETS.find((p) => {
    const r = presetRange(p.key);
    return r.from === value.from && r.to === value.to;
  })?.key;

  const setFrom = (from) => {
    if (!from) return;
    onChange({ from, to: from > value.to ? from : value.to });
  };

  const setTo = (to) => {
    if (!to) return;
    onChange({ from: to < value.from ? to : value.from, to });
  };

  return (
    <div className="drf">
      <div className="drf-presets">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => onChange(presetRange(p.key))}
            className={`btn drf-preset ${activeKey === p.key ? "active" : ""}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <label className="drf-field">
        From
        <input
          type="date"
          value={value.from}
          onChange={(e) => setFrom(e.target.value)}
          className="drf-input"
        />
      </label>

      <label className="drf-field">
        To
        <input
          type="date"
          value={value.to}
          onChange={(e) => setTo(e.target.value)}
          className="drf-input"
        />
      </label>

      {children && <div className="drf-extra">{children}</div>}
    </div>
  );
}