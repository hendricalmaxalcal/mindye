import { useEffect, useState } from "react";
import { listMySales } from "../services/mySalesService";

const NONE = [];

export default function useMySales(uid, { from, to }) {
  const key = `${uid}|${from}|${to}`;
  const [result, setResult] = useState({ key: "", sales: NONE, error: "" });

  useEffect(() => {
    let active = true;

    listMySales({ uid, from, to })
      .then((sales) => {
        if (active) setResult({ key, sales, error: "" });
      })
      .catch((err) => {
        console.error(err);
        const message =
          err.code === "failed-precondition"
            ? "This page needs a one-time database setup. Please tell the administrator."
            : "Could not load your sales.";
        if (active) setResult({ key, sales: NONE, error: message });
      });

    return () => {
      active = false;
    };
  }, [uid, from, to, key]);

  const loading = result.key !== key;
  return {
    sales: loading ? NONE : result.sales,
    error: loading ? "" : result.error,
    loading,
  };
}