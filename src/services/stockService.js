import { collection, doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

export async function receiveStock({ items, supplier, receiver }) {
  if (!items || items.length === 0) {
    throw new Error("The delivery list is empty.");
  }

  const receiptRef = doc(collection(db, "stockReceipts"));

  const summary = await runTransaction(db, async (tx) => {
    // Firestore requires all reads before any writes.
    const refs = items.map((i) => doc(db, "products", i.barcode));
    const snaps = await Promise.all(refs.map((r) => tx.get(r)));

    const lines = snaps.map((snap, idx) => {
      const item = items[idx];
      if (!snap.exists()) {
        throw new Error(`"${item.name}" is not in the product list.`);
      }
      const p = snap.data();
      const qty = Number(item.qty);
      if (!Number.isInteger(qty) || qty < 1) {
        throw new Error(`Enter a valid quantity for "${p.name}".`);
      }
      const stockBefore = Number(p.stock) || 0;
      return {
        barcode: snap.id,
        name: p.name,
        qty,
        stockBefore,
        stockAfter: stockBefore + qty,
      };
    });

    lines.forEach((l, idx) => {
      tx.update(refs[idx], {
        stock: l.stockAfter,
        updatedAt: serverTimestamp(),
      });
    });

    tx.set(receiptRef, {
      items: lines,
      supplier: String(supplier || "").trim(),
      receivedBy: receiver.id,
      receivedByName: receiver.name || "",
      createdAt: serverTimestamp(),
    });

    return {
      products: lines.length,
      units: lines.reduce((sum, l) => sum + l.qty, 0),
    };
  });

  return { id: receiptRef.id, ...summary };
}