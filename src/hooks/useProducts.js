import { useEffect, useState } from "react";
import {
  listProducts,
  addProduct,
  updateProduct,
  deleteProduct,
} from "../services/productService";

export default function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    listProducts()
      .then((data) => {
        if (active) {
          setProducts(data);
          setError("");
        }
      })
      .catch((err) => {
        console.error(err);
        if (active) setError("Could not load products.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reloadKey]);

  const refresh = () => {
    setLoading(true);
    setReloadKey((k) => k + 1);
  };

  const create = async (data) => {
    await addProduct(data);
    refresh();
  };

  const edit = async (barcode, data) => {
    await updateProduct(barcode, data);
    refresh();
  };

  const remove = async (barcode) => {
    await deleteProduct(barcode);
    refresh();
  };

  return { products, loading, error, refresh, create, edit, remove };
}