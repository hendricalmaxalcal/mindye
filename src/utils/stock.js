// Returns "out", "low" or "ok".
export function stockStatus(stock, lowStockLevel) {
  const s = Number(stock) || 0;
  const level = Number(lowStockLevel) || 0;
  if (s <= 0) return "out";
  if (level > 0 && s <= level) return "low";
  return "ok";
}