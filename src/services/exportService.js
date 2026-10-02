import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { STORE } from "../config/store";
import { downloadCsv, downloadFile } from "../utils/download";
import { startOfDay, endOfDay } from "../utils/dates";
import { markBackupDone } from "../utils/backupInfo";

const pad = (n) => String(n).padStart(2, "0");
const day = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const stamp = (d) => (d ? `${day(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}` : "");
const toDate = (value) => (value?.toDate ? value.toDate() : null);

// Every record in a date range, oldest first. There is no row limit here.
async function listAllInRange(name, { from, to }) {
  const q = query(
    collection(db, name),
    where("createdAt", ">=", startOfDay(from)),
    where("createdAt", "<=", endOfDay(to)),
    orderBy("createdAt", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return { id: d.id, ...data, createdAt: toDate(data.createdAt) };
  });
}

// Each function returns how many rows it exported (0 means nothing to export).

export async function exportProductsCsv() {
  const snap = await getDocs(collection(db, "products"));
  const rows = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  if (rows.length === 0) return 0;

  downloadCsv(`products-${day(new Date())}.csv`, rows, [
    { label: "Barcode", value: (r) => r.id, text: true },
    { label: "Name", value: (r) => r.name },
    { label: "Category", value: (r) => r.category },
    { label: "Selling price", value: (r) => r.price },
    { label: "Cost price", value: (r) => r.costPrice },
    { label: "Stock", value: (r) => r.stock },
    { label: "Low-stock level", value: (r) => r.lowStockLevel },
  ]);
  return rows.length;
}

// One row per item sold, so totals can be summed or pivoted in Excel.
export async function exportSalesCsv(range) {
  const sales = await listAllInRange("sales", range);
  const rows = sales.flatMap((sale) =>
    (sale.items || []).map((item) => ({ sale, item }))
  );
  if (rows.length === 0) return 0;

  downloadCsv(`sales-${range.from}-to-${range.to}.csv`, rows, [
    { label: "Sale", value: ({ sale }) => sale.id.slice(0, 6).toUpperCase(), text: true },
    { label: "Date", value: ({ sale }) => stamp(sale.createdAt) },
    { label: "Saler", value: ({ sale }) => sale.cashierName },
    { label: "Barcode", value: ({ item }) => item.barcode, text: true },
    { label: "Product", value: ({ item }) => item.name },
    { label: "Quantity", value: ({ item }) => item.qty },
    { label: "Unit price", value: ({ item }) => item.price },
    { label: "Unit cost", value: ({ item }) => item.costPrice },
    { label: "Line total", value: ({ item }) => item.lineTotal },
  ]);
  return rows.length;
}

export async function exportDeliveriesCsv(range) {
  const receipts = await listAllInRange("stockReceipts", range);
  const rows = receipts.flatMap((receipt) =>
    (receipt.items || []).map((item) => ({ receipt, item }))
  );
  if (rows.length === 0) return 0;

  downloadCsv(`deliveries-${range.from}-to-${range.to}.csv`, rows, [
    { label: "Date", value: ({ receipt }) => stamp(receipt.createdAt) },
    { label: "Received by", value: ({ receipt }) => receipt.receivedByName },
    { label: "Supplier", value: ({ receipt }) => receipt.supplier },
    { label: "Barcode", value: ({ item }) => item.barcode, text: true },
    { label: "Product", value: ({ item }) => item.name },
    { label: "Quantity received", value: ({ item }) => item.qty },
    { label: "Stock before", value: ({ item }) => item.stockBefore },
    { label: "Stock after", value: ({ item }) => item.stockAfter },
  ]);
  return rows.length;
}

export async function exportAdjustmentsCsv(range) {
  const rows = await listAllInRange("stockAdjustments", range);
  if (rows.length === 0) return 0;

  downloadCsv(`adjustments-${range.from}-to-${range.to}.csv`, rows, [
    { label: "Date", value: (r) => stamp(r.createdAt) },
    { label: "Barcode", value: (r) => r.barcode, text: true },
    { label: "Product", value: (r) => r.name },
    { label: "Change", value: (r) => r.change },
    { label: "Stock before", value: (r) => r.stockBefore },
    { label: "Stock after", value: (r) => r.stockAfter },
    { label: "Reason", value: (r) => r.reason },
    { label: "Note", value: (r) => r.note },
    { label: "Adjusted by", value: (r) => r.adjustedByName },
  ]);
  return rows.length;
}

// Turns Firestore timestamps into readable date text so the file is plain JSON.
function toPlain(value) {
  if (value === null || value === undefined) return value;
  if (typeof value.toDate === "function") return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(toPlain);
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, toPlain(v)])
    );
  }
  return value;
}

async function readAll(name) {
  const snap = await getDocs(collection(db, name));
  return snap.docs.map((d) => ({ id: d.id, ...toPlain(d.data()) }));
}

// Everything in one file. Returns how many records of each kind it saved.
export async function exportFullBackup() {
  const names = ["users", "products", "sales", "stockReceipts", "stockAdjustments"];
  const data = {};
  for (const name of names) {
    data[name] = await readAll(name);
  }
  const counts = Object.fromEntries(names.map((n) => [n, data[n].length]));

  const now = new Date();
  const backup = {
    store: STORE.name,
    exportedAt: now.toISOString(),
    counts,
    data,
  };

  downloadFile(
    `backup-${day(now)}-${pad(now.getHours())}${pad(now.getMinutes())}.json`,
    JSON.stringify(backup, null, 2),
    "application/json"
  );
  markBackupDone();
  return counts;
}