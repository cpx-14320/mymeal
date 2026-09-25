// 純前端匯出，用 CSV（加 BOM）而非真正的 .xlsx 二進位格式——雙擊即可用 Excel 開啟，
// 中文欄位也不會亂碼，且不需要額外的解析函式庫（避免引入有已知漏洞的 xlsx 套件）。
function escapeCsvCell(value: string | number) {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** downloadCsv 的反向操作：把 CSV 文字轉回二維陣列，處理逗號/換行包在雙引號裡、
 *  雙引號用 "" 跳脫的情況（跟 escapeCsvCell 的輸出格式對應），並去掉開頭的 BOM。
 *  忽略整列都是空字串的資料列（例如檔案結尾的空行）。 */
export function parseCsv(text: string): string[][] {
  const src = text.startsWith("﻿") ? text.slice(1) : text;
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i += 2;
        } else {
          inQuotes = false;
          i += 1;
        }
      } else {
        field += c;
        i += 1;
      }
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      i += 1;
    } else if (c === ",") {
      row.push(field);
      field = "";
      i += 1;
    } else if (c === "\r") {
      i += 1;
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i += 1;
    } else {
      field += c;
      i += 1;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
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
