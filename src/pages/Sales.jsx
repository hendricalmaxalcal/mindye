import { useMemo, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import useBarcodeScanner from "../hooks/useBarcodeScanner";
import { getProductByBarcode } from "../services/productService";
import { completeSale } from "../services/salesService";
import ScanInput from "../components/ScanInput";
import Cart from "../components/Cart";
import Receipt from "../components/Receipt";
import { formatMoney } from "../utils/format";
import { beepSuccess, beepError } from "../utils/sounds";
import "../css/Sales.css";

export default function Sales() {
  const { user, profile } = useAuth();

  const [items, setItems] = useState([]);
  const itemsRef = useRef([]); // always holds the latest cart, even during fast scans
  const [status, setStatus] = useState(null);
  const [amountReceived, setAmountReceived] = useState("");
  const [busy, setBusy] = useState(false);
  const [saleError, setSaleError] = useState("");
  const [completed, setCompleted] = useState(null);

  const commit = (next) => {
    itemsRef.current = next;
    setItems(next);
  };

  const fail = (text) => {
    beepError();
    setStatus({ type: "error", text });
  };

  const handleScan = async (raw) => {
    const barcode = raw.trim();
    if (!barcode) return;

    try {
      const product = await getProductByBarcode(barcode);
      if (!product) {
        fail(`Product not found: ${barcode}`);
        return;
      }

      const current = itemsRef.current;
      const existing = current.find((i) => i.barcode === product.id);
      const nextQty = (existing ? existing.qty : 0) + 1;
      const stock = Number(product.stock) || 0;

      if (stock < nextQty) {
        fail(`Not enough stock for ${product.name} (available: ${stock}).`);
        return;
      }

      const next = existing
        ? current.map((i) =>
            i.barcode === product.id
              ? { ...i, qty: nextQty, stock, price: product.price }
              : i
          )
        : [
            ...current,
            {
              barcode: product.id,
              name: product.name,
              price: product.price,
              qty: 1,
              stock,
            },
          ];

      commit(next);
      beepSuccess();
      setStatus({ type: "ok", text: `Added: ${product.name}` });
    } catch (err) {
      console.error(err);
      fail("Could not look up the product. Check your connection.");
    }
  };

  useBarcodeScanner(handleScan, { enabled: !busy && !completed });

  const increase = (barcode) => {
    const item = itemsRef.current.find((i) => i.barcode === barcode);
    if (!item) return;
    if (item.qty + 1 > item.stock) {
      fail(`Not enough stock for ${item.name} (available: ${item.stock}).`);
      return;
    }
    commit(
      itemsRef.current.map((i) =>
        i.barcode === barcode ? { ...i, qty: i.qty + 1 } : i
      )
    );
  };

  const decrease = (barcode) => {
    commit(
      itemsRef.current
        .map((i) => (i.barcode === barcode ? { ...i, qty: i.qty - 1 } : i))
        .filter((i) => i.qty > 0)
    );
  };

  const remove = (barcode) => {
    commit(itemsRef.current.filter((i) => i.barcode !== barcode));
  };

  const clearCart = () => {
    if (items.length === 0) return;
    if (window.confirm("Remove all items from this sale?")) {
      commit([]);
      setStatus(null);
      setSaleError("");
      setAmountReceived("");
    }
  };

  const total = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.qty, 0),
    [items]
  );

  const receivedNumber = amountReceived === "" ? null : Number(amountReceived);
  const change = receivedNumber !== null ? receivedNumber - total : null;
  const shortBy = change !== null && change < 0;
  const canComplete = items.length > 0 && !busy && !shortBy;

  const handleComplete = async () => {
    setSaleError("");
    setBusy(true);
    try {
      const sale = await completeSale({
        items,
        paymentMethod: "cash",
        amountReceived,
        cashier: { id: user.uid, name: profile?.name },
      });
      commit([]);
      setStatus(null);
      setCompleted(sale);
      beepSuccess();
    } catch (err) {
      console.error(err);
      setSaleError(err.message || "Could not complete the sale.");
      beepError();
    } finally {
      setBusy(false);
    }
  };

  const startNewSale = () => {
    setCompleted(null);
    setAmountReceived("");
    setSaleError("");
    setStatus(null);
  };

  if (completed) {
    return (
      <div className="sales-done card">
        <h1 className="sales-done-title">Sale complete</h1>
        <p className="sales-done-id">
          Sale #{completed.id.slice(0, 6).toUpperCase()}
        </p>

        <div className="sales-row sales-row-big">
          <span>Total</span>
          <strong>{formatMoney(completed.total)}</strong>
        </div>
        {completed.received !== null && (
          <>
            <div className="sales-row">
              <span>Received</span>
              <span>{formatMoney(completed.received)}</span>
            </div>
            <div className="sales-row sales-row-big">
              <span>Change</span>
              <strong>{formatMoney(completed.change)}</strong>
            </div>
          </>
        )}

        <button onClick={() => window.print()} className="btn sales-done-btn">
          Print receipt
        </button>
        <button onClick={startNewSale} className="btn btn-primary sales-done-btn">
          New sale
        </button>

        <Receipt sale={completed} cashier={profile?.name} />
      </div>
    );
  }

  return (
    <div>
      <h1 className="page-title">Sales</h1>

      <div className="sales-layout">
        <section className="card">
          <ScanInput onSubmit={handleScan} status={status} disabled={busy} />
          <Cart
            items={items}
            onIncrease={increase}
            onDecrease={decrease}
            onRemove={remove}
            disabled={busy}
          />
        </section>

        <aside className="card sales-summary">
          <div className="sales-row sales-row-big">
            <span>Total</span>
            <strong>{formatMoney(total)}</strong>
          </div>

          <label className="sales-label" htmlFor="received">
            Cash received (leave empty if exact)
          </label>
          <input
            id="received"
            type="number"
            min="0"
            step="any"
            value={amountReceived}
            onChange={(e) => setAmountReceived(e.target.value)}
            disabled={busy}
            className="sales-field"
          />
          {change !== null && (
            <div className={`sales-row ${shortBy ? "sales-short" : "sales-change"}`}>
              <span>{shortBy ? "Still to pay" : "Change"}</span>
              <strong>{formatMoney(Math.abs(change))}</strong>
            </div>
          )}

          {saleError && (
            <p className="sales-error" role="alert">
              {saleError}
            </p>
          )}

          <button
            onClick={handleComplete}
            disabled={!canComplete}
            className="btn btn-primary sales-complete"
          >
            {busy ? "Saving..." : "Complete sale"}
          </button>
          <button
            onClick={clearCart}
            disabled={busy || items.length === 0}
            className="btn sales-clear"
          >
            Clear sale
          </button>
        </aside>
      </div>
    </div>
  );
}