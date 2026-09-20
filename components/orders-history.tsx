"use client";

import { useMemo, useState } from "react";
import { PageSizeSelect, Pagination } from "@/components/ui/primitives";
import { OrderRow, type Order } from "@/components/order-row";

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export function OrdersHistory({ rows: allHistory }: { rows: Order[] }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [year, setYear] = useState<number | "all">("all");
  const [month, setMonth] = useState<number | "all">("all");

  // order.date 是 "YYYY/MM/DD" 字串（沿用 group_orders.date 的格式），直接拆字串取年月，
  // 不用轉成 Date 物件比對，避免時區換算把日期算錯。
  const years = useMemo(() => {
    const all = allHistory.map((o) => Number(o.date.split("/")[0]));
    return [...new Set(all)].sort((a, b) => b - a);
  }, [allHistory]);

  const history = allHistory.filter((o) => {
    const [y, m] = o.date.split("/").map(Number);
    return (year === "all" || y === year) && (month === "all" || m === month);
  });

  const pageCount = Math.max(1, Math.ceil(history.length / pageSize));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * pageSize;
  const rows = history.slice(start, start + pageSize);

  if (allHistory.length === 0) {
    return <p className="text-sm text-muted">還沒有已完成的訂單紀錄。</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-end gap-2 text-xs text-muted">
        <PageSizeSelect
          value={pageSize}
          onChange={(n) => {
            setPageSize(n);
            setPage(1);
          }}
        />
        <select
          value={year}
          onChange={(e) => {
            setYear(e.target.value === "all" ? "all" : Number(e.target.value));
            setPage(1);
          }}
          className="rounded-lg border border-line bg-surface px-2 py-1 text-xs text-ink outline-none focus:border-brand"
          aria-label="篩選年份"
        >
          <option value="all">全部年份</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <select
          value={month}
          onChange={(e) => {
            setMonth(e.target.value === "all" ? "all" : Number(e.target.value));
            setPage(1);
          }}
          className="rounded-lg border border-line bg-surface px-2 py-1 text-xs text-ink outline-none focus:border-brand"
          aria-label="篩選月份"
        >
          <option value="all">全部月份</option>
          {MONTHS.map((m) => (
            <option key={m} value={m}>
              {m} 月
            </option>
          ))}
        </select>
      </div>

      {history.length === 0 ? (
        <p className="text-sm text-muted">這個範圍內沒有訂單紀錄。</p>
      ) : (
        <div className="space-y-3">
          {rows.map((o) => (
            <OrderRow key={o.id} order={o} />
          ))}
        </div>
      )}

      <Pagination
        page={current}
        pageCount={pageCount}
        total={history.length}
        pageSize={pageSize}
        onPage={setPage}
        unit="筆"
      />
    </div>
  );
}
