import { collection, doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

export async function completeSale({
  items,
  paymentMethod,
  amountReceived,
  cashier,
}) {
  if (!items || items.length === 0) throw new Error("The cart is empty.");

  const saleRef = doc(collection(db, "sales"));

  const result = await runTransaction(db, async (tx) => {
    // Firestore requires all reads before any writes.
    const refs = items.map((i) => doc(db, "products", i.barcode));
    const snaps = await Promise.all(refs.map((r) => tx.get(r)));

    const lines = snaps.map((snap, idx) => {
      const item = items[idx];
      if (!snap.exists()) {
        throw new Error(`"${item.name}" is no longer in the product list.`);
      }
      const p = snap.data();
      const qty = Number(item.qty);
      const stock = Number(p.stock) || 0;

      if (!Number.isInteger(qty) || qty < 1) {
        throw new Error(`Invalid quantity for "${p.name}".`);
      }
      if (stock < qty) {
        throw new Error(`Not enough stock for "${p.name}" (available: ${stock}).`);
      }

      return {
        barcode: snap.id,
        name: p.name,
        price: p.price,
        costPrice: p.costPrice || 0,
        qty,
        lineTotal: p.price * qty,
        newStock: stock - qty,
      };
    });

    const total = lines.reduce((sum, l) => sum + l.lineTotal, 0);

    let received = null;
    let change = 0;
    if (paymentMethod === "cash" && amountReceived !== "" && amountReceived != null) {
      received = Number(amountReceived);
      if (Number.isNaN(received) || received < total) {
        throw new Error("The amount received is less than the total.");
      }
      change = received - total;
    }

    lines.forEach((l, idx) => {
      tx.update(refs[idx], { stock: l.newStock, updatedAt: serverTimestamp() });
    });

    const saleItems = lines.map(({ newStock, ...rest }) => rest);

    tx.set(saleRef, {
      items: saleItems,
      total,
      paymentMethod,
      amountReceived: received,
      change,
      cashierId: cashier.id,
      cashierName: cashier.name || "",
      createdAt: serverTimestamp(),
    });

    return { items: saleItems, total, paymentMethod, received, change };
  });

  return { id: saleRef.id, createdAt: new Date(), ...result };
}