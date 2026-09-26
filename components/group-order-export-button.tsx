"use client";

import { Button } from "@/components/ui/primitives";
import { downloadCsv } from "@/lib/csv-export";
import { summarizeOrderLines, type OrderLine } from "@/lib/mock";

export function GroupOrderExportButton({
  lines,
  host,
  filename,
  label = "匯出 CSV",
}: {
  lines: OrderLine[];
  host: string;
  filename: string;
  label?: string;
}) {
  const handleExport = () => {
    const summary = summarizeOrderLines(lines);
    const totalQty = summary.reduce((sum, s) => sum + s.totalQty, 0);
    downloadCsv(filename, [host], [
      ["餐點", "飯量", "數量"],
      ...summary.map((s) => [s.itemName, s.riceBreakdown, s.totalQty]),
      ["合計", "", totalQty],
    ]);
  };

  return (
    <Button variant="secondary" onClick={handleExport}>
      {label}
    </Button>
  );
}
