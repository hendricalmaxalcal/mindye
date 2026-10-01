import { Link } from "react-router-dom";
import useProducts from "../hooks/useProducts";
import { stockStatus } from "../utils/stock";
import "../css/LowStockAlert.css";

export default function LowStockAlert() {
  const { products } = useProducts();

  const low = products.filter(
    (p) => stockStatus(p.stock, p.lowStockLevel) !== "ok"
  );
  if (low.length === 0) return null;

  const out = low.filter(
    (p) => stockStatus(p.stock, p.lowStockLevel) === "out"
  ).length;

  return (
    <Link to="/reports" className="lsa">
      <strong>
        {low.length} product{low.length === 1 ? "" : "s"} need restocking
      </strong>
      <span>
        {out > 0 ? `${out} out of stock. ` : ""}Open Reports to see the list.
      </span>
    </Link>
  );
}