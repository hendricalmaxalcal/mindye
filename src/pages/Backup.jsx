import { useState } from "react";
import DateRangeFilter from "../components/DateRangeFilter";
import {
  exportProductsCsv,
  exportSalesCsv,
  exportDeliveriesCsv,
  exportAdjustmentsCsv,
  exportFullBackup,
} from "../services/exportService";
import { getLastBackup } from "../utils/backupInfo";
import { presetRange } from "../utils/dates";
import { formatDate } from "../utils/format";
import "../css/Backup.css";

export default function Backup() {
  const [range, setRange] = useState(() => presetRange("month"));
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState(null); // { type, text }
  const [lastBackup, setLastBackup] = useState(() => getLastBackup());

  const runCsv = async (key, task, label) => {
    setBusy(key);
    setNotice(null);
    try {
      const count = await task();
      setNotice(
        count === 0
          ? { type: "error", text: `Nothing to export for ${label}.` }
          : { type: "ok", text: `Downloaded ${count} rows (${label}).` }
      );
    } catch (err) {
      console.error(err);
      setNotice({
        type: "error",
        text: "Could not export. Check your connection and try again.",
      });
    } finally {
      setBusy("");
    }
  };

  const runFull = async () => {
    setBusy("full");
    setNotice(null);
    try {
      const c = await exportFullBackup();
      setLastBackup(getLastBackup());
      setNotice({
        type: "ok",
        text:
          `Backup downloaded: ${c.products} products, ${c.sales} sales, ` +
          `${c.stockReceipts} deliveries, ${c.stockAdjustments} adjustments, ` +
          `${c.users} staff profiles.`,
      });
    } catch (err) {
      console.error(err);
      setNotice({
        type: "error",
        text: "Could not create the backup. Check your connection and try again.",
      });
    } finally {
      setBusy("");
    }
  };

  const anyBusy = Boolean(busy);
  const label = (key, text) => (busy === key ? "Preparing..." : text);

  return (
    <div>
      <h1 className="page-title">Backup and export</h1>

      {notice && (
        <p className={`bk-notice bk-notice-${notice.type}`} role="status">
          {notice.text}
        </p>
      )}

      <section className="card bk-section">
        <h2 className="bk-heading">Full backup</h2>
        <p className="bk-text">
          One file with everything: products, sales, deliveries, stock
          adjustments and staff profiles. Make one regularly, for example every
          week after closing, and keep it somewhere safe such as a USB drive or
          Google Drive.
        </p>
        <p className="bk-meta">
          Last full backup on this computer:{" "}
          <strong>{lastBackup ? formatDate(lastBackup) : "never"}</strong>
        </p>
        <button
          onClick={runFull}
          disabled={anyBusy}
          className="btn btn-primary"
        >
          {label("full", "Download full backup")}
        </button>
      </section>

      <section className="card bk-section">
        <h2 className="bk-heading">Spreadsheet exports (Excel)</h2>
        <p className="bk-text">
          These files open in Excel or Google Sheets. Choose the period for
          sales, deliveries and adjustments.
        </p>

        <DateRangeFilter value={range} onChange={setRange} />

        <div className="bk-buttons">
          <button
            onClick={() => runCsv("sales", () => exportSalesCsv(range), "sales")}
            disabled={anyBusy}
            className="btn"
          >
            {label("sales", "Sales")}
          </button>
          <button
            onClick={() =>
              runCsv("deliveries", () => exportDeliveriesCsv(range), "deliveries")
            }
            disabled={anyBusy}
            className="btn"
          >
            {label("deliveries", "Deliveries")}
          </button>
          <button
            onClick={() =>
              runCsv("adjustments", () => exportAdjustmentsCsv(range), "adjustments")
            }
            disabled={anyBusy}
            className="btn"
          >
            {label("adjustments", "Adjustments")}
          </button>
        </div>

        <p className="bk-text bk-gap">
          The product list does not depend on dates.
        </p>
        <div className="bk-buttons">
          <button
            onClick={() => runCsv("products", exportProductsCsv, "products")}
            disabled={anyBusy}
            className="btn"
          >
            {label("products", "Products")}
          </button>
        </div>
      </section>

      <section className="card bk-section">
        <h2 className="bk-heading">Good to know</h2>
        <ul className="bk-list">
          <li>
            Backup files contain your sales and staff emails, so keep them
            private.
          </li>
          <li>
            Each export reads every record once from the database. On the free
            plan (50,000 reads a day), run a full backup once, not many times
            in a row.
          </li>
          <li>
            Login accounts and passwords are not in the file. They can be
            recreated on the Staff page.
          </li>
        </ul>
      </section>
    </div>
  );
}