import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import useSales from "../hooks/useSales";
import useProducts from "../hooks/useProducts";
import DateRangeFilter from "../components/DateRangeFilter";
import LowStockBadge from "../components/LowStockBadge";
import { buildReport, MAX_SALES } from "../services/reportService";
import { presetRange, formatDay } from "../utils/dates";
import { formatMoney } from "../utils/format";
import { stockStatus } from "../utils/stock";
import "../css/Reports.css";

function Stat({ label, value, hint }) {
  return (
    <div className="card rep-stat">
      <div className="rep-stat-label">{label}</div>
      <div className="rep-stat-value">{value}</div>
      {hint && <div className="rep-stat-hint">{hint}</div>}
    </div>
  );
}

export default function Reports() {
  const [range, setRange] = useState(() => presetRange("last7"));
  const { sales, loading, error } = useSales(range);
  const { products } = useProducts();

  const report = useMemo(
    () => buildReport(sales, range.from, range.to),
    [sales, range]
  );

  const maxDay = Math.max(0, ...report.byDay.map((d) => d.revenue));
  const topProducts = report.bestSellers.slice(0, 10);

  const lowProducts = useMemo(
    () =>
      products
        .filter((p) => stockStatus(p.stock, p.lowStockLevel) !== "ok")
        .sort((a, b) => (Number(a.stock) || 0) - (Number(b.stock) || 0)),
    [products]
  );

  return (
    <div>
      <h1 className="page-title">Reports</h1>

      <DateRangeFilter value={range} onChange={setRange} />

      {error && <p className="msg-error">{error}</p>}
      {loading && <p className="msg-muted">Loading report...</p>}

      {!loading && !error && (
        <>
          {sales.length >= MAX_SALES && (
            <p className="rep-note">
              This period has more than {MAX_SALES} sales, so only the latest{" "}
              {MAX_SALES} are included. Choose a shorter period for exact
              totals.
            </p>
          )}

          <div className="rep-cards">
            <Stat label="Cash revenue" value={formatMoney(report.revenue)} />
            <Stat label="Sales" value={report.count} />
            <Stat label="Units sold" value={report.units} />
            <Stat label="Average sale" value={formatMoney(report.average)} />
            <Stat
              label="Estimated profit"
              value={formatMoney(report.profit)}
              hint="Revenue minus cost price"
            />
          </div>

          {report.count === 0 ? (
            <p className="rep-empty msg-muted">No sales in this period.</p>
          ) : (
            <>
              <section className="card rep-section">
                <h2 className="rep-heading">Revenue by day</h2>
                <div className="rep-chart">
                  {report.byDay.map((d) => {
                    const pct = maxDay ? (d.revenue / maxDay) * 100 : 0;
                    return (
                      <div
                        key={d.date}
                        className="rep-bar-col"
                        title={`${formatDay(d.date)}: ${formatMoney(
                          d.revenue
                        )} (${d.sales} sales)`}
                      >
                        <div className="rep-bar-track">
                          <div className="rep-bar" style={{ "--h": `${pct}%` }} />
                        </div>
                        <span className="rep-bar-label">
                          {Number(d.date.slice(8))}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <p className="rep-caption">
                  One bar per day (the number is the day of the month). Hover
                  over a bar to see the amount.
                </p>
              </section>

              <div className="rep-columns">
                <section className="card rep-section">
                  <h2 className="rep-heading">Best sellers</h2>
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th className="rep-num">Units</th>
                          <th className="rep-num">Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topProducts.map((p) => (
                          <tr key={p.barcode}>
                            <td>{p.name}</td>
                            <td className="rep-num">{p.units}</td>
                            <td className="rep-num">{formatMoney(p.revenue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="card rep-section">
                  <h2 className="rep-heading">By saler</h2>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Saler</th>
                        <th className="rep-num">Sales</th>
                        <th className="rep-num">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.bySaler.map((p) => (
                        <tr key={p.id}>
                          <td>{p.name}</td>
                          <td className="rep-num">{p.sales}</td>
                          <td className="rep-num">{formatMoney(p.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>
              </div>
            </>
          )}
        </>
      )}

      <section className="card rep-section">
        <h2 className="rep-heading">Low stock alerts</h2>
        {lowProducts.length === 0 ? (
          <p className="msg-muted">All products are well stocked.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Barcode</th>
                  <th className="rep-num">In stock</th>
                  <th className="rep-num">Low-stock level</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {lowProducts.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>{p.id}</td>
                    <td className="rep-num">{p.stock}</td>
                    <td className="rep-num">{p.lowStockLevel || "-"}</td>
                    <td>
                      <LowStockBadge
                        stock={p.stock}
                        lowStockLevel={p.lowStockLevel}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="rep-caption">
          Change a product's low-stock level on the{" "}
          <Link to="/products">Products</Link> page.
        </p>
      </section>
    </div>
  );
}