import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import { startOfDay, endOfDay } from "../utils/dates";

export const MAX_LOG = 500;

async function listByRange(name, { from, to }) {
  const q = query(
    collection(db, name),
    where("createdAt", ">=", startOfDay(from)),
    where("createdAt", "<=", endOfDay(to)),
    orderBy("createdAt", "desc"),
    limit(MAX_LOG)
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

export const listReceipts = (range) => listByRange("stockReceipts", range);
export const listAdjustments = (range) => listByRange("stockAdjustments", range);