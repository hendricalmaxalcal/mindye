// Tanzanian shillings. Shown as "TSh 2,500" (no decimals).
export function formatMoney(value) {
  const amount = Math.round(Number(value) || 0);
  return `TSh ${amount.toLocaleString("en-US")}`;
}

// Accepts a Firestore Timestamp, a Date, or a date string.
export function formatDate(value) {
  if (!value) return "";
  const d = value.toDate ? value.toDate() : new Date(value);
  return d.toLocaleString();
}