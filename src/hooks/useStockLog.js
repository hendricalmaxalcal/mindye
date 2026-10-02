import { useEffect, useState } from "react";
import { listReceipts, listAdjustments } from "../services/stockLogService";

const NONE = [];

export default function useStockLog({ from, to }) {
  const key = `${from}|${to}`;
  const [result, setResult] = useState({
    key: "",
    receipts: NONE,
    adjustments: NONE,
    error: "",
  });

  useEffect(() => {
    let active = true;

    Promise.all([listReceipts({ from, to }), listAdjustments({ from, to })])
      .then(([receipts, adjustments]) => {
        if (active) setResult({ key, receipts, adjustments, error: "" });
      })
      .catch((err) => {
        console.error(err);
        if (active) {
          setResult({
            key,
            receipts: NONE,
            adjustments: NONE,
            error: "Could not load the stock log.",
          });
        }
      });

    return () => {
      active = false;
    };
  }, [from, to, key]);

  const loading = result.key !== key;
  return {
    receipts: loading ? NONE : result.receipts,
    adjustments: loading ? NONE : result.adjustments,
    error: loading ? "" : result.error,
    loading,
  };
}