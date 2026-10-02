import { Fragment, useState } from "react";
import useStockLog from "../hooks/useStockLog";
import DateRangeFilter from "../components/DateRangeFilter";
import { ADJUST_REASONS } from "../services/stockService";
import { MAX_LOG } from "../services/stockLogService";
import { presetRange } from "../utils/dates";
import { formatDate } from "../utils/format";
import "../css/StockLog.css";

const reasonLabel = (value) =>
  ADJUST_REASONS.find((r) => r.value === value)?.label || value || "-";

const unitsOf = (receipt) =>
  (receipt.items || []).reduce((sum, i) => sum + (Number(i.qty) || 0), 0);

export default function StockLog() {
  const [range, setRange] = useState(() => presetRange("last7"));
  const [tab, setTab] = useState("deliveries");
  const [openId, setOpenId] = useState(null);

  const { receipts, adjustments, loading, error } = useStockLog(range);

  const handleRange = (next) => {
    setRange(next);
    setOpenId(null);
  };

  const list = tab === "deliveries" ? receipts : adjustments;

  return (
    <div>
      <h1 className="page-title">Stock log</h1>

      <DateRangeFilter value={range} onChange={handleRange} />

      <div className="sl-tabs">
        <button
          type="button"
          className={`btn sl-tab ${tab === "deliveries" ? "active" : ""}`}
          onClick={() => setTab("deliveries")}
        >
          Deliveries ({receipts.length})
        </button>
        <button
          type="button"
          className={`btn sl-tab ${tab === "adjustments" ? "active" : ""}`}
          onClick={() => setTab("adjustments")}
        >
          Adjustments ({adjustments.length})
        </button>
      </div>

      {error && <p className="msg-error">{error}</p>}
      {loading && <p className="msg-muted">Loading...</p>}

      {!loading && !error && list.length >= MAX_LOG && (
        <p className="sl-note">
          Showing the latest {MAX_LOG} records in this period. Choose a shorter
          period to see the rest.
        </p>
      )}

      {!loading && !error && list.length === 0 && (
        <p className="sl-empty msg-muted">Nothing recorded in this period.</p>
      )}

      {!loading && !error && tab === "deliveries" && receipts.length > 0 && (
        <div className="table-wrap card">
          <table className="table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Received by</th>
                <th>Supplier</th>
                <th className="sl-num">Products</th>
                <th className="sl-num">Units</th>
              </tr>
            </thead>
            <tbody>
              {receipts.map((r) => {
                const open = openId === r.id;
                return (
                  <Fragment key={r.id}>
                    <tr
                      className="sl-row"
                      onClick={() => setOpenId(open ? null : r.id)}
                    >
                      <td>{r.createdAt ? formatDate(r.createdAt) : "-"}</td>
                      <td>{r.receivedByName || "Unknown"}</td>
                      <td>{r.supplier || "-"}</td>
                      <td className="sl-num">{(r.items || []).length}</td>
                      <td className="sl-num">{unitsOf(r)}</td>
                    </tr>

                    {open && (
                      <tr className="sl-detail">
                        <td colSpan={5}>
                          <table className="sl-items">
                            <thead>
                              <tr>
                                <th>Product</th>
                                <th className="sl-num">Received</th>
                                <th className="sl-num">Stock before</th>
                                <th className="sl-num">Stock after</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(r.items || []).map((i) => (
                                <tr key={i.barcode}>
                                  <td>
                                    {i.name}
                                    <span className="sl-code">{i.barcode}</span>
                                  </td>
                                  <td className="sl-num">{i.qty}</td>
                                  <td className="sl-num">{i.stockBefore}</td>
                                  <td className="sl-num">{i.stockAfter}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && tab === "adjustments" && adjustments.length > 0 && (
        <div className="table-wrap card">
          <table className="table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Product</th>
                <th className="sl-num">Change</th>
                <th className="sl-num">Stock</th>
                <th>Reason</th>
                <th>By</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {adjustments.map((a) => (
                <tr key={a.id}>
                  <td>{a.createdAt ? formatDate(a.createdAt) : "-"}</td>
                  <td>
                    {a.name}
                    <span className="sl-code">{a.barcode}</span>
                  </td>
                  <td
                    className={`sl-num ${a.change < 0 ? "sl-down" : "sl-up"}`}
                  >
                    {a.change > 0 ? "+" : ""}
                    {a.change}
                  </td>
                  <td className="sl-num">
                    {a.stockBefore} to {a.stockAfter}
                  </td>
                  <td>{reasonLabel(a.reason)}</td>
                  <td>{a.adjustedByName || "Unknown"}</td>
                  <td>{a.note || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}