import { formatMoney } from "../utils/format";
import "../css/Cart.css";

export default function Cart({
  items,
  onIncrease,
  onDecrease,
  onRemove,
  disabled,
}) {
  if (items.length === 0) {
    return (
      <p className="cart-empty">The cart is empty. Scan a product to start.</p>
    );
  }

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Product</th>
            <th className="cart-num">Price</th>
            <th>Qty</th>
            <th className="cart-num">Total</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.barcode}>
              <td>
                <div className="cart-name">{i.name}</div>
                <div className="cart-code">{i.barcode}</div>
              </td>
              <td className="cart-num">{formatMoney(i.price)}</td>
              <td>
                <div className="cart-qty">
                  <button
                    type="button"
                    className="btn cart-qty-btn"
                    onClick={() => onDecrease(i.barcode)}
                    disabled={disabled}
                    aria-label={`Decrease ${i.name}`}
                  >
                    -
                  </button>
                  <span className="cart-qty-value">{i.qty}</span>
                  <button
                    type="button"
                    className="btn cart-qty-btn"
                    onClick={() => onIncrease(i.barcode)}
                    disabled={disabled}
                    aria-label={`Increase ${i.name}`}
                  >
                    +
                  </button>
                </div>
              </td>
              <td className="cart-num">{formatMoney(i.price * i.qty)}</td>
              <td>
                <button
                  type="button"
                  className="cart-remove"
                  onClick={() => onRemove(i.barcode)}
                  disabled={disabled}
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
  );
}