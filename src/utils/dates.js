const pad = (n) => String(n).padStart(2, "0");

// Date -> "YYYY-MM-DD" in local time (the format of <input type="date">)
export function toInputValue(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parse(str) {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function startOfDay(str) {
  const d = parse(str);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(str) {
  const d = parse(str);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function daysBetween(from, to) {
  return Math.round((parse(to) - parse(from)) / 86400000);
}

export function eachDay(from, to) {
  const out = [];
  const d = parse(from);
  const end = parse(to);
  while (d <= end) {
    out.push(toInputValue(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

export function formatDay(str) {
  return parse(str).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function presetRange(key) {
  const now = new Date();
  const today = toInputValue(now);

  if (key === "yesterday") {
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    const v = toInputValue(y);
    return { from: v, to: v };
  }
  if (key === "last7") {
    const s = new Date(now);
    s.setDate(s.getDate() - 6);
    return { from: toInputValue(s), to: today };
  }
  if (key === "month") {
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: toInputValue(first), to: today };
  }
  return { from: today, to: today };
}