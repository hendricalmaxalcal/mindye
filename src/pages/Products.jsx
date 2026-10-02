import { useEffect, useMemo, useState } from "react";
import useProducts from "../hooks/useProducts";
import { useAuth } from "../context/AuthContext";
import { adjustStock } from "../services/stockService";
import ProductForm from "../components/ProductForm";
import AdjustStockForm from "../components/AdjustStockForm";
import LowStockBadge from "../components/LowStockBadge";
import { formatMoney } from "../utils/format";
import { stockStatus } from "../utils/stock";
import "../css/Products.css";

export default function Products() {
  const { user, profile, role } = useAuth();
  const canEdit = role === "admin";

  const { products, loading, error, create, edit, remove, refresh } =
    useProducts();

  const [search, setSearch] = useState("");
  const [lowOnly, setLowOnly] = useState(false);
  // null, { mode: "add" }, { mode: "edit", product } or { mode: "adjust", product }
  const [modal, setModal] = useState(null);
  const [notice, setNotice] = useState(null); // { type, text }
  const [busyId, setBusyId] = useState("");

  // Close the popup with the Escape key.
  useEffect(() => {
    if (!modal) return;
    const onKey = (e) => {
      if (e.key === "Escape") setModal(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modal]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((p) => {
      if (lowOnly && stockStatus(p.stock, p.lowStockLevel) === "ok") {
        return false;
      }
      if (!term) return true;
      return (
        p.id.toLowerCase().includes(term) ||
        (p.name || "").toLowerCase().includes(term) ||
        (p.category || "").toLowerCase().includes(term)
      );
    });
  }, [products, search, lowOnly]);

  const lowCount = useMemo(
    () =>
      products.filter((p) => stockStatus(p.stock, p.lowStockLevel) !== "ok")
        .length,
    [products]
  );

  const handleSubmit = async (data) => {
    if (modal.mode === "edit") await edit(modal.product.id, data);
    else await create(data);
    setModal(null);
  };

  const handleAdjust = async (data) => {
    const product = modal.product;
    await adjustStock({
      barcode: product.id,
      newQty: data.newQty,
      reason: data.reason,
      note: data.note,
      admin: { id: user.uid, name: profile?.name },
    });
    setNotice({ type: "ok", text: `Stock updated for "${product.name}".` });
    setModal(null);
    refresh();
  };

  const handleDelete = async (p) => {
    if ((Number(p.stock) || 0) !== 0) return;

    const sure = window.confirm(
      `Delete "${p.name}" permanently?\n\n` +
        "Past sales keep its name. It can no longer be sold or received " +
        "unless you add it again."
    );
    if (!sure) return;

    setBusyId(p.id);
    try {
      await remove(p.id);
      setNotice({ type: "ok", text: `"${p.name}" was deleted.` });
    } catch (err) {
      console.error(err);
      setNotice({
        type: "error",
        text: err.message || "Could not delete the product.",
      });
    } finally {
      setBusyId("");
    }
  };

  const modalTitle = !modal
    ? ""
    : modal.mode === "add"
    ? "Add product"
    : modal.mode === "edit"
    ? `Edit: ${modal.product.name}`
    : `Adjust stock: ${modal.product.name}`;

  return (
    <div>
      <h1 className="page-title">Products</h1>

      <div className="products-toolbar">
        <input
          type="search"
          placeholder="Search by name, category, or scan a barcode"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
          className="products-search"
        />

        <label className="products-check">
          <input
            type="checkbox"
            checked={lowOnly}
            onChange={(e) => setLowOnly(e.target.checked)}
          />
          Low stock only ({lowCount})
        </label>

        {canEdit && (
          <button
            onClick={() => {
              setNotice(null);
              setModal({ mode: "add" });
            }}
            className="btn btn-primary"
          >
            + Add product
          </button>
        )}
      </div>

      {notice && (
        <p
          className={`products-notice products-notice-${notice.type}`}
          role="status"
        >
          {notice.text}
        </p>
      )}
      {error && <p className="msg-error">{error}</p>}
      {loading && products.length === 0 && (
        <p className="msg-muted">Loading products...</p>
      )}

      {!loading && !error && (
        <p className="products-summary msg-muted">
          Showing {visible.length} of {products.length} products
        </p>
      )}

      {visible.length > 0 && (
        <div className="table-wrap card">
          <table className="table">
            <thead>
              <tr>
                <th>Barcode</th>
                <th>Name</th>
                <th>Category</th>
                <th className="products-num">Price</th>
                <th className="products-num">Stock</th>
                {canEdit && <th></th>}
              </tr>
            </thead>
            <tbody>
              {visible.map((p) => {
                const hasStock = (Number(p.stock) || 0) !== 0;
                return (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td>{p.name}</td>
                    <td>{p.category || "-"}</td>
                    <td className="products-num">{formatMoney(p.price)}</td>
                    <td className="products-num">
                      {p.stock}
                      <LowStockBadge
                        stock={p.stock}
                        lowStockLevel={p.lowStockLevel}
                      />
                    </td>
                    {canEdit && (
                      <td>
                        <div className="products-actions">
                          <button
                            onClick={() => {
                              setNotice(null);
                              setModal({ mode: "edit", product: p });
                            }}
                            disabled={busyId === p.id}
                            className="btn"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              setNotice(null);
                              setModal({ mode: "adjust", product: p });
                            }}
                            disabled={busyId === p.id}
                            title="Correct the stock (expired, damaged, lost, recount)"
                            className="btn"
                          >
                            Adjust stock
                          </button>
                          <button
                            onClick={() => handleDelete(p)}
                            disabled={hasStock || busyId === p.id}
                            title={
                              hasStock
                                ? "Stock must reach 0 before this product can be deleted"
                                : "Delete this product"
                            }
                            className="btn btn-danger"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && visible.length === 0 && (
        <p className="products-empty msg-muted">
          {products.length === 0
            ? "No products yet."
            : "No products match your search."}
        </p>
      )}

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">{modalTitle}</h2>

            {modal.mode === "adjust" ? (
              <AdjustStockForm
                key={modal.product.id}
                product={modal.product}
                onSubmit={handleAdjust}
                onCancel={() => setModal(null)}
              />
            ) : (
              <ProductForm
                key={modal.mode === "edit" ? modal.product.id : "new"}
                initialValues={modal.mode === "edit" ? modal.product : undefined}
                onSubmit={handleSubmit}
                onCancel={() => setModal(null)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}