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
import { MAX_SALES } from "./reportService";

// Sales made by one saler between two "YYYY-MM-DD" dates (inclusive), newest first.
export async function listMySales({ uid, from, to }) {
  const q = query(
    collection(db, "sales"),
    where("cashierId", "==", uid),
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