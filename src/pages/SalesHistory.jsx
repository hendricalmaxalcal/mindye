import { Fragment, useMemo, useState } from "react";
import useSales from "../hooks/useSales";
import DateRangeFilter from "../components/DateRangeFilter";
import Receipt from "../components/Receipt";
import { MAX_SALES } from "../services/reportService";
import { toInputValue } from "../utils/dates";
import { formatMoney, formatDate } from "../utils/format";
import "../css/SalesHistory.css";

const unitsOf = (sale) =>
  (sale.items || []).reduce((sum, i) => sum + (Number(i.qty) || 0), 0);

export default function SalesHistory() {
  const today = toInputValue(new Date());
  const [range, setRange] = useState({ from: today, to: today });
  const [saler, setSaler] = useState("");
  const [openId, setOpenId] = useState(null);

  const { sales, loading, error } = useSales(range);

  const handleRange = (next) => {
    setRange(next);
    setSaler("");
    setOpenId(null);
  };

  const salers = useMemo(() => {
    const map = new Map();
    sales.forEach((s) => map.set(s.cashierId, s.cashierName || "Unknown"));
    return [...map].sort((a, b) => a[1].localeCompare(b[1]));
  }, [sales]);

  const filtered = useMemo(
    () => sales.filter((s) => !saler || s.cashierId === saler),
    [sales, saler]
  );

  const totals = useMemo(
    () => ({
      revenue: filtered.reduce((sum, s) => sum + (Number(s.total) || 0), 0),
      units: filtered.reduce((sum, s) => sum + unitsOf(s), 0),
    }),
    [filtered]
  );

  return (
    <div>
      <h1 className="page-title">Sales history</h1>

      <DateRangeFilter value={range} onChange={handleRange}>
        <label className="drf-field">
          Saler
          <select
            value={saler}
            onChange={(e) => setSaler(e.target.value)}
            className="drf-input"
          >
            <option value="">All salers</option>
            {salers.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </DateRangeFilter>

      {error && <p className="msg-error">{error}</p>}
      {loading && <p className="msg-muted">Loading sales...</p>}

      {!loading && !error && (
        <>
          <div className="sh-stats">
            <div className="card sh-stat">
              <div className="sh-stat-label">Sales</div>
              <div className="sh-stat-value">{filtered.length}</div>
            </div>
            <div className="card sh-stat">
              <div className="sh-stat-label">Revenue</div>
              <div className="sh-stat-value">{formatMoney(totals.revenue)}</div>
            </div>
            <div className="card sh-stat">
              <div className="sh-stat-label">Units sold</div>
              <div className="sh-stat-value">{totals.units}</div>
            </div>
          </div>

          {sales.length >= MAX_SALES && (
            <p className="sh-note">
              Showing the latest {MAX_SALES} sales in this period. Choose a
              shorter period to see the rest.
            </p>
          )}

          {filtered.length === 0 ? (
            <p className="sh-empty msg-muted">No sales found for these filters.</p>
          ) : (
            <div className="table-wrap card">
              <table className="table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Sale</th>
                    <th>Saler</th>
                    <th className="sh-num">Units</th>
                    <th className="sh-num">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => {
                    const open = openId === s.id;
                    return (
                      <Fragment key={s.id}>
                        <tr
                          className="sh-row"
                          onClick={() => setOpenId(open ? null : s.id)}
                        >
                          <td>{s.createdAt ? formatDate(s.createdAt) : "-"}</td>
                          <td>#{s.id.slice(0, 6).toUpperCase()}</td>
                          <td>{s.cashierName || "Unknown"}</td>
                          <td className="sh-num">{unitsOf(s)}</td>
                          <td className="sh-num">{formatMoney(s.total)}</td>
                        </tr>

                        {open && (
                          <tr className="sh-detail">
                            <td colSpan={5}>
                              <table className="sh-items">
                                <thead>
                                  <tr>
                                    <th>Product</th>
                                    <th className="sh-num">Price</th>
                                    <th className="sh-num">Qty</th>
                                    <th className="sh-num">Total</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(s.items || []).map((i) => (
                                    <tr key={i.barcode}>
                                      <td>
                                        {i.name}
                                        <span className="sh-code">{i.barcode}</span>
                                      </td>
                                      <td className="sh-num">
                                        {formatMoney(i.price)}
                                      </td>
                                      <td className="sh-num">{i.qty}</td>
                                      <td className="sh-num">
                                        {formatMoney(i.lineTotal)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              {s.amountReceived != null && (
                                <p className="sh-pay">
                                  Cash received {formatMoney(s.amountReceived)} -
                                  change {formatMoney(s.change)}
                                </p>
                              )}
                              <button
                                type="button"
                                className="btn sh-print"
                                onClick={() => window.print()}
                              >
                                Print receipt
                              </button>
                              <Receipt sale={s} cashier={s.cashierName} />
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
        </>
      )}
    </div>
  );
}