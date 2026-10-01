import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import { startOfDay, endOfDay, daysBetween, eachDay } from "../utils/dates";

export const MAX_SALES = 1000;

const PAYMENT_LABELS = {
  cash: "Cash",
  mobile: "Mobile money",
  card: "Card",
};
export const paymentLabel = (value) => PAYMENT_LABELS[value] || value || "Other";

// Sales between two "YYYY-MM-DD" dates (inclusive), newest first.
export async function listSales({ from, to }) {
  const q = query(
    collection(db, "sales"),
    where("createdAt", ">=", startOfDay(from)),
    where("createdAt", "<=", endOfDay(to)),
    orderBy("createdAt", "desc"),
    limit(MAX_SALES)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : null,
    };
  });
}

function bump(map, key, init, apply) {
  const entry = map.get(key) || init;
  apply(entry);
  map.set(key, entry);
}

// Turns a list of sales into the numbers shown on the Reports page.
export function buildReport(sales, from, to) {
  let revenue = 0;
  let units = 0;
  let cost = 0;

  const days = new Map();
  const products = new Map();
  const payments = new Map();
  const salers = new Map();

  // Show empty days too, for periods up to about two months.
  if (daysBetween(from, to) <= 62) {
    eachDay(from, to).forEach((k) =>
      days.set(k, { date: k, sales: 0, revenue: 0 })
    );
  }

  for (const s of sales) {
    const total = Number(s.total) || 0;
    revenue += total;

    for (const i of s.items || []) {
      const qty = Number(i.qty) || 0;
      const lineTotal = Number(i.lineTotal) || (Number(i.price) || 0) * qty;
      units += qty;
      cost += (Number(i.costPrice) || 0) * qty;

      bump(
        products,
        i.barcode,
        { barcode: i.barcode, name: i.name, units: 0, revenue: 0 },
        (p) => {
          p.units += qty;
          p.revenue += lineTotal;
        }
      );
    }

    if (s.createdAt) {
      const key = `${s.createdAt.getFullYear()}-${String(
        s.createdAt.getMonth() + 1
      ).padStart(2, "0")}-${String(s.createdAt.getDate()).padStart(2, "0")}`;
      bump(days, key, { date: key, sales: 0, revenue: 0 }, (d) => {
        d.sales += 1;
        d.revenue += total;
      });
    }

    const method = s.paymentMethod || "other";
    bump(payments, method, { method, sales: 0, revenue: 0 }, (p) => {
      p.sales += 1;
      p.revenue += total;
    });

    const salerId = s.cashierId || "unknown";
    bump(
      salers,
      salerId,
      { id: salerId, name: s.cashierName || "Unknown", sales: 0, revenue: 0 },
      (p) => {
        p.sales += 1;
        p.revenue += total;
      }
    );
  }

  const byRevenue = (a, b) => b.revenue - a.revenue;

  return {
    count: sales.length,
    revenue,
    units,
    cost,
    profit: revenue - cost,
    average: sales.length ? revenue / sales.length : 0,
    byDay: [...days.values()].sort((a, b) => a.date.localeCompare(b.date)),
    bestSellers: [...products.values()].sort(
      (a, b) => b.units - a.units || b.revenue - a.revenue
    ),
    byPayment: [...payments.values()].sort(byRevenue),
    bySaler: [...salers.values()].sort(byRevenue),
  };
}