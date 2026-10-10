import { Fragment, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import useMySales from "../hooks/useMySales";
import DateRangeFilter from "../components/DateRangeFilter";
import { MAX_SALES } from "../services/reportService";
import { toInputValue } from "../utils/dates";
import { formatMoney, formatDate } from "../utils/format";
import "../css/SalesHistory.css";

const unitsOf = (sale) =>
  (sale.items || []).reduce((sum, i) => sum + (Number(i.qty) || 0), 0);

export default function MySales() {
  const { user, profile } = useAuth();
  const today = toInputValue(new Date());
  const [range, setRange] = useState({ from: today, to: today });
  const [openId, setOpenId] = useState(null);

  const { sales, loading, error } = useMySales(user.uid, range);

  const handleRange = (next) => {
    setRange(next);
    setOpenId(null);
  };

  const totals = useMemo(
    () => ({
      cash: sales.reduce((sum, s) => sum + (Number(s.total) || 0), 0),
      units: sales.reduce((sum, s) => sum + unitsOf(s), 0),
    }),
    [sales]
  );

  return (
    <div>
      <h1 className="page-title">My sales</h1>
      <p className="msg-muted">Sales made by {profile?.name}</p>

      <DateRangeFilter value={range} onChange={handleRange} />

      {error && <p className="msg-error">{error}</p>}
      {loading && <p className="msg-muted">Loading your sales...</p>}

      {!loading && !error && (
        <>
          <div className="sh-stats">
            <div className="card sh-stat">
              <div className="sh-stat-label">Sales made</div>
              <div className="sh-stat-value">{sales.length}</div>
            </div>
            <div className="card sh-stat">
              <div className="sh-stat-label">Cash collected</div>
              <div className="sh-stat-value">{formatMoney(totals.cash)}</div>
            </div>
            <div className="card sh-stat">
              <div className="sh-stat-label">Units sold</div>
              <div className="sh-stat-value">{totals.units}</div>
            </div>
          </div>

          {sales.length >= MAX_SALES && (
            <p className="sh-note">
              Showing your latest {MAX_SALES} sales in this period. Choose a
              shorter period to see the rest.
            </p>
          )}

          {sales.length === 0 ? (
            <p className="sh-empty msg-muted">
              You have no sales in this period.
            </p>
          ) : (
            <div className="table-wrap card">
              <table className="table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Sale</th>
                    <th className="sh-num">Units</th>
                    <th className="sh-num">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((s) => {
                    const open = openId === s.id;
                    return (
                      <Fragment key={s.id}>
                        <tr
                          className="sh-row"
                          onClick={() => setOpenId(open ? null : s.id)}
                        >
                          <td>{s.createdAt ? formatDate(s.createdAt) : "-"}</td>
                          <td>#{s.id.slice(0, 6).toUpperCase()}</td>
                          <td className="sh-num">{unitsOf(s)}</td>
                          <td className="sh-num">{formatMoney(s.total)}</td>
                        </tr>

                        {open && (
                          <tr className="sh-detail">
                            <td colSpan={4}>
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