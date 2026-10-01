import { useMemo, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import useBarcodeScanner from "../hooks/useBarcodeScanner";
import { getProductByBarcode, addProduct } from "../services/productService";
import { receiveStock } from "../services/stockService";
import ScanInput from "../components/ScanInput";
import ProductForm from "../components/ProductForm";
import { beepSuccess, beepError } from "../utils/sounds";
import "../css/Receiving.css";

export default function Receiving() {
  const { user, profile } = useAuth();

  const [items, setItems] = useState([]);
  const itemsRef = useRef([]); // always holds the latest list, even during fast scans
  const [supplier, setSupplier] = useState("");
  const [status, setStatus] = useState(null);
  const [unknownCode, setUnknownCode] = useState(null);
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [done, setDone] = useState(null);

  const commit = (next) => {
    itemsRef.current = next;
    setItems(next);
  };

  const addToList = ({ barcode, name, stock }) => {
    const current = itemsRef.current;
    const existing = current.find((i) => i.barcode === barcode);
    commit(
      existing
        ? current.map((i) =>
            i.barcode === barcode
              ? { ...i, qty: (Number(i.qty) || 0) + 1 }
              : i
          )
        : [...current, { barcode, name, stock, qty: 1 }]
    );
  };

  const handleScan = async (raw) => {
    const barcode = raw.trim();
    if (!barcode) return;

    try {
      const product = await getProductByBarcode(barcode);

      if (!product) {
        beepError();
        setStatus({
          type: "error",
          text: `New barcode ${barcode}. Add it as a product to continue.`,
        });
        setUnknownCode(barcode);
        return;
      }

      addToList({
        barcode: product.id,
        name: product.name,
        stock: Number(product.stock) || 0,
      });
      beepSuccess();
      setStatus({ type: "ok", text: `Added: ${product.name}` });
    } catch (err) {
      console.error(err);
      beepError();
      setStatus({
        type: "error",
        text: "Could not look up the product. Check your connection.",
      });
    }
  };

  useBarcodeScanner(handleScan, {
    enabled: !busy && !done && !unknownCode,
  });

  const handleNewProduct = async (data) => {
    // Stock starts at 0 because the delivery list adds the received quantity.
    await addProduct({ ...data, stock: 0 });
    const name = String(data.name).trim();
    addToList({ barcode: String(data.barcode).trim(), name, stock: 0 });
    setUnknownCode(null);
    beepSuccess();
    setStatus({ type: "ok", text: `New product added: ${name}` });
  };

  const setQty = (barcode, raw) => {
    const qty = raw === "" ? "" : Math.max(0, Math.floor(Number(raw)) || 0);
    commit(
      itemsRef.current.map((i) => (i.barcode === barcode ? { ...i, qty } : i))
    );
  };

  const remove = (barcode) => {
    commit(itemsRef.current.filter((i) => i.barcode !== barcode));
  };

  const clearList = () => {
    if (items.length === 0) return;
    if (window.confirm("Remove all items from this delivery?")) {
      commit([]);
      setStatus(null);
      setSaveError("");
    }
  };

  const totalUnits = useMemo(
    () => items.reduce((sum, i) => sum + (Number(i.qty) || 0), 0),
    [items]
  );

  const allValid =
    items.length > 0 &&
    items.every((i) => Number.isInteger(i.qty) && i.qty >= 1);

  const handleConfirm = async () => {
    setSaveError("");
    setBusy(true);
    try {
      const receipt = await receiveStock({
        items,
        supplier,
        receiver: { id: user.uid, name: profile?.name },
      });
      commit([]);
      setStatus(null);
      setDone(receipt);
      beepSuccess();
    } catch (err) {
      console.error(err);
      setSaveError(err.message || "Could not save the delivery.");
      beepError();
    } finally {
      setBusy(false);
    }
  };

  const startNew = () => {
    setDone(null);
    setSupplier("");
    setSaveError("");
    setStatus(null);
  };

  if (done) {
    return (
      <div className="recv-done card">
        <h1 className="recv-done-title">Delivery recorded</h1>
        <p className="recv-done-text">
          {done.products} product{done.products === 1 ? "" : "s"},{" "}
          {done.units} unit{done.units === 1 ? "" : "s"} added to stock.
        </p>
        <button onClick={startNew} className="btn btn-primary recv-done-btn">
          New delivery
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="page-title">Receiving</h1>

      <section className="card">
        <label className="recv-label" htmlFor="supplier">
          Supplier (optional)
        </label>
        <input
          id="supplier"
          value={supplier}
          onChange={(e) => setSupplier(e.target.value)}
          disabled={busy}
          placeholder="Who delivered these goods?"
          className="recv-field"
        />

        <ScanInput onSubmit={handleScan} status={status} disabled={busy} />

        {items.length === 0 ? (
          <p className="recv-empty">
            No items yet. Scan each package as it comes in.
          </p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th className="recv-num">In stock now</th>
                  <th>Quantity received</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.barcode}>
                    <td>
                      <div className="recv-name">{i.name}</div>
                      <div className="recv-code">{i.barcode}</div>
                    </td>
                    <td className="recv-num">{i.stock}</td>
                    <td>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={i.qty}
                        onChange={(e) => setQty(i.barcode, e.target.value)}
                        disabled={busy}
                        className="recv-qty"
                        aria-label={`Quantity for ${i.name}`}
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="recv-remove"
                        onClick={() => remove(i.barcode)}
                        disabled={busy}
                        aria-label={`Remove ${i.name}`}
                      >
                        &times;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {saveError && (
          <p className="recv-error" role="alert">
            {saveError}
          </p>
        )}

        <div className="recv-footer">
          <span className="recv-total">
            {items.length} product{items.length === 1 ? "" : "s"}, {totalUnits} unit
            {totalUnits === 1 ? "" : "s"}
          </span>
          <div className="recv-buttons">
            <button
              onClick={clearList}
              disabled={busy || items.length === 0}
              className="btn"
            >
              Clear
            </button>
            <button
              onClick={handleConfirm}
              disabled={!allValid || busy}
              className="btn btn-primary"
            >
              {busy ? "Saving..." : "Confirm delivery"}
            </button>
          </div>
        </div>
      </section>

      {unknownCode && (
        <div className="recv-overlay">
          <div className="recv-modal">
            <h2 className="recv-modal-title">New product</h2>
            <p className="recv-modal-text">
              This barcode is not in the system yet. Fill in the details to add
              it, and it will be put on the delivery list.
            </p>
            <ProductForm
              defaultBarcode={unknownCode}
              hideStock
              onSubmit={handleNewProduct}
              onCancel={() => setUnknownCode(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}