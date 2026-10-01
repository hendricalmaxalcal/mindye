import { useEffect, useState } from "react";
import { listSales } from "../services/reportService";

const NONE = [];

export default function useSales({ from, to }) {
  const key = `${from}|${to}`;
  const [result, setResult] = useState({ key: "", sales: NONE, error: "" });

  useEffect(() => {
    let active = true;

    listSales({ from, to })
      .then((sales) => {
        if (active) setResult({ key, sales, error: "" });
      })
      .catch((err) => {
        console.error(err);
        if (active) {
          setResult({ key, sales: NONE, error: "Could not load sales." });
        }
      });

    return () => {
      active = false;
    };
  }, [from, to, key]);

  const loading = result.key !== key;
  return {
    sales: loading ? NONE : result.sales,
    error: loading ? "" : result.error,
    loading,
  };
}