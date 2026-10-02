function escapeCell(value) {
  if (value === null || value === undefined) return "";
  let text = String(value);
  // Stops spreadsheet programs from running text that starts like a formula
  if (typeof value === "string" && /^[=+\-@]/.test(text)) text = `'${text}`;
  if (/[",\r\n]/.test(text)) text = `"${text.replace(/"/g, '""')}"`;
  return text;
}

function textCell(value) {
  // Keeps barcodes as text, so Excel does not turn 6001234567890 into 6.00E+12
  const formula = `="${String(value).replace(/"/g, '""')}"`;
  return `"${formula.replace(/"/g, '""')}"`;
}

export function toCsv(rows, columns) {
  const header = columns.map((c) => escapeCell(c.label)).join(",");
  const lines = rows.map((row) =>
    columns
      .map((c) => {
        const value = c.value(row);
        if (c.text && value !== "" && value !== null && value !== undefined) {
          return textCell(value);
        }
        return escapeCell(value);
      })
      .join(",")
  );
  return [header, ...lines].join("\r\n");
}

export function downloadFile(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadCsv(filename, rows, columns) {
  // The leading \uFEFF makes Excel read accents and special characters correctly
  downloadFile(
    filename,
    "\uFEFF" + toCsv(rows, columns),
    "text/csv;charset=utf-8"
  );
}