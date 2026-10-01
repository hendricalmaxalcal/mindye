import { createPortal } from "react-dom";
import { STORE } from "../config/store";
import { formatMoney, formatDate } from "../utils/format";
import "../css/Receipt.css";

// Works for a sale just completed and for a sale loaded from history.
export default function Receipt({ sale, cashier }) {
  const received = sale.received ?? sale.amountReceived ?? null;
  const change = sale.change ?? 0;
  const items = sale.items || [];

  return createPortal(
    <div className="receipt-print" aria-hidden="true">
      {STORE.logoOnReceipt && STORE.logo && (
        <img src={STORE.logo} alt="" className="receipt-logo" />
      )}
      <div className="receipt-store">{STORE.name}</div>
      {STORE.address && <div className="receipt-center">{STORE.address}</div>}
      {STORE.phone && <div className="receipt-center">Tel: {STORE.phone}</div>}

      <hr className="receipt-line" />

      <div className="receipt-row">
        <span>Receipt</span>
        <span>#{sale.id.slice(0, 6).toUpperCase()}</span>
      </div>
      <div className="receipt-row">
        <span>Date</span>
        <span>{sale.createdAt ? formatDate(sale.createdAt) : ""}</span>
      </div>
      {cashier && (
        <div className="receipt-row">
          <span>Served by</span>
          <span>{cashier}</span>
        </div>
      )}

      <hr className="receipt-line" />

      {items.map((i) => (
        <div key={i.barcode} className="receipt-item">
          <div>{i.name}</div>
          <div className="receipt-row">
            <span>
              {i.qty} x {formatMoney(i.price)}
            </span>
            <span>{formatMoney(i.lineTotal)}</span>
          </div>
        </div>
      ))}

      <hr className="receipt-line" />

      <div className="receipt-row receipt-total">
        <span>TOTAL</span>
        <span>{formatMoney(sale.total)}</span>
      </div>
      {received !== null && (
        <>
          <div className="receipt-row">
            <span>Cash</span>
            <span>{formatMoney(received)}</span>
          </div>
          <div className="receipt-row">
            <span>Change</span>
            <span>{formatMoney(change)}</span>
          </div>
        </>
      )}

      <hr className="receipt-line" />

      <div className="receipt-center">{STORE.footer}</div>
    </div>,
    document.body
  );
}