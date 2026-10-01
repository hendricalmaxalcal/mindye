import { useRef, useState } from "react";
import "../css/ProductForm.css";

const EMPTY = {
  barcode: "",
  name: "",
  price: "",
  costPrice: "",
  stock: "",
  category: "",
  lowStockLevel: "",
};

export default function ProductForm({
  initialValues, // pass a product to edit it; leave out to add a new one
  defaultBarcode = "", // pre-fill the barcode (used for unknown scanned codes)
  hideStock = false, // hide the opening stock field (used while receiving)
  onSubmit, // async (formData) => void, may throw an Error
  onCancel,
}) {
  const isEdit = Boolean(initialValues);
  const nameRef = useRef(null);

  const [values, setValues] = useState(() =>
    isEdit
      ? {
          ...EMPTY,
          ...initialValues,
          barcode: initialValues.id ?? initialValues.barcode ?? "",
        }
      : { ...EMPTY, barcode: defaultBarcode }
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
  };

  // A scanner presses Enter after the barcode. Don't submit the form;
  // move to the next field instead.
  const handleBarcodeKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      nameRef.current?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await onSubmit(values);
    } catch (err) {
      setError(err.message || "Could not save the product.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="pf-form">
      <label className="pf-label">
        Barcode
        <input
          name="barcode"
          value={values.barcode}
          onChange={handleChange}
          onKeyDown={handleBarcodeKeyDown}
          disabled={isEdit}
          autoFocus={!isEdit && !defaultBarcode}
          placeholder="Scan or type the barcode"
          required
          className="pf-input"
        />
      </label>

      <label className="pf-label">
        Product name
        <input
          ref={nameRef}
          name="name"
          value={values.name}
          onChange={handleChange}
          autoFocus={isEdit || Boolean(defaultBarcode)}
          required
          className="pf-input"
        />
      </label>

      <div className="pf-row">
        <label className="pf-label">
          Selling price
          <input
            name="price"
            type="number"
            min="0"
            step="any"
            value={values.price}
            onChange={handleChange}
            required
            className="pf-input"
          />
        </label>

        <label className="pf-label">
          Cost price
          <input
            name="costPrice"
            type="number"
            min="0"
            step="any"
            value={values.costPrice}
            onChange={handleChange}
            className="pf-input"
          />
        </label>
      </div>

      <div className="pf-row">
        {!isEdit && !hideStock && (
          <label className="pf-label">
            Opening stock
            <input
              name="stock"
              type="number"
              min="0"
              step="1"
              value={values.stock}
              onChange={handleChange}
              className="pf-input"
            />
          </label>
        )}

        <label className="pf-label">
          Low-stock level
          <input
            name="lowStockLevel"
            type="number"
            min="0"
            step="1"
            value={values.lowStockLevel}
            onChange={handleChange}
            className="pf-input"
          />
        </label>
      </div>

      <label className="pf-label">
        Category
        <input
          name="category"
          value={values.category}
          onChange={handleChange}
          className="pf-input"
        />
      </label>

      {error && (
        <p className="pf-error" role="alert">
          {error}
        </p>
      )}

      <div className="pf-actions">
        <button type="submit" disabled={busy} className="btn btn-primary">
          {busy ? "Saving..." : isEdit ? "Save changes" : "Add product"}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}