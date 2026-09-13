// 純前端匯出，用 CSV（加 BOM）而非真正的 .xlsx 二進位格式——雙擊即可用 Excel 開啟，
// 中文欄位也不會亂碼，且不需要額外的解析函式庫（避免引入有已知漏洞的 xlsx 套件）。
function escapeCsvCell(value: string | number) {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function downloadCsv(
  filename: string,
  headers: (string | number)[],
  rows: (string | number)[][],
) {
  const lines = [headers, ...rows].map((row) => row.map(escapeCsvCell).join(","));
  const csv = String.fromCharCode(0xfeff) + lines.join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
