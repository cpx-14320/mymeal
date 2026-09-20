"use client";

import { useState } from "react";
import { PageSizeSelect, Pagination } from "@/components/ui/primitives";
import { OrderRow, type Order } from "@/components/order-row";

export function OrdersHistory({ rows: history }: { rows: Order[] }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const pageCount = Math.max(1, Math.ceil(history.length / pageSize));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * pageSize;
  const rows = history.slice(start, start + pageSize);

  if (history.length === 0) {
    return <p className="text-sm text-muted">還沒有已完成的訂單紀錄。</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <PageSizeSelect
          value={pageSize}
          onChange={(n) => {
            setPageSize(n);
            setPage(1);
          }}
        />
      </div>

      <div className="space-y-3">
        {rows.map((o) => (
          <OrderRow key={o.id} order={o} />
        ))}
      </div>

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
