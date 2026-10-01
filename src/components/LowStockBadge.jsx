import { stockStatus } from "../utils/stock";
import "../css/LowStockBadge.css";

export default function LowStockBadge({ stock, lowStockLevel }) {
  const status = stockStatus(stock, lowStockLevel);
  if (status === "ok") return null;

  return (
    <span className={`stock-badge stock-badge-${status}`}>
      {status === "out" ? "Out of stock" : "Low stock"}
    </span>
  );
}