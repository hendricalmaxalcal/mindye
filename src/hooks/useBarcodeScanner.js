import { useEffect, useRef } from "react";

// Listens for a barcode scanner (it types fast, then presses Enter).
// Typing inside input boxes is ignored, so normal typing never counts as a scan.
export default function useBarcodeScanner(
  onScan,
  { enabled = true, minLength = 3, maxGap = 80 } = {}
) {
  const onScanRef = useRef(onScan);
  const buffer = useRef("");
  const lastTime = useRef(0);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!enabled) return;

    const handler = (e) => {
      const el = e.target;
      const tag = el?.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        el?.isContentEditable
      ) {
        return;
      }
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      const now = Date.now();
      // A long pause means a human is typing, so start over.
      if (now - lastTime.current > maxGap) buffer.current = "";
      lastTime.current = now;

      if (e.key === "Enter") {
        const code = buffer.current;
        buffer.current = "";
        if (code.length >= minLength) {
          e.preventDefault();
          onScanRef.current(code);
        }
        return;
      }

      if (e.key.length === 1) buffer.current += e.key;
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [enabled, minLength, maxGap]);
}