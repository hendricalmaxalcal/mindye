import { collection, doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

export const ADJUST_REASONS = [
  { value: "expired", label: "Expired" },
  { value: "damaged", label: "Damaged" },
  { value: "lost", label: "Lost or stolen" },
  { value: "count", label: "Stock count correction" },
  { value: "other", label: "Other" },
];

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

// Admin only: set a product's stock to the real quantity and record why.
export async function adjustStock({ barcode, newQty, reason, note, admin }) {
  const qty = Number(newQty);
  if (!Number.isInteger(qty) || qty < 0) {
    throw new Error("Enter a whole number, 0 or more.");
  }
  if (!ADJUST_REASONS.some((r) => r.value === reason)) {
    throw new Error("Choose a reason.");
  }

  const productRef = doc(db, "products", barcode);
  const logRef = doc(collection(db, "stockAdjustments"));

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(productRef);
    if (!snap.exists()) throw new Error("This product no longer exists.");

    const p = snap.data();
    const before = Number(p.stock) || 0;
    if (before === qty) {
      throw new Error("That is the same as the current stock.");
    }

    tx.update(productRef, { stock: qty, updatedAt: serverTimestamp() });
    tx.set(logRef, {
      barcode,
      name: p.name,
      stockBefore: before,
      stockAfter: qty,
      change: qty - before,
      reason,
      note: String(note || "").trim(),
      adjustedBy: admin.id,
      adjustedByName: admin.name || "",
      createdAt: serverTimestamp(),
    });
  });
}