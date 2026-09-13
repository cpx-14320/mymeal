"use client";

import { useState } from "react";
import {
  ButtonLink,
  TableWrap,
  Th,
  Td,
  Pagination,
  PageSizeSelect,
} from "@/components/ui/primitives";
import { itemStatsList } from "@/lib/mock";

export function ItemStatsTable() {
  const [stats] = useState(() => itemStatsList());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const pageCount = Math.max(1, Math.ceil(stats.length / pageSize));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * pageSize;
  const rows = stats.slice(start, start + pageSize);

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

      <TableWrap>
        <thead>
          <tr>
            <Th>品項</Th>
            <Th className="text-right">價格</Th>
            <Th className="text-right">總訂購數量</Th>
            <Th className="text-right">被訂購次數</Th>
            <Th className="text-right">平均評分</Th>
            <Th className="text-right">評論數</Th>
            <Th className="text-right">操作</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => (
            <tr key={s.itemId}>
              <Td className="font-medium">{s.itemName}</Td>
              <Td className="text-right tabular-nums">NT$ {s.price}</Td>
              <Td className="text-right tabular-nums">{s.totalQuantity}</Td>
              <Td className="text-right tabular-nums">{s.orderCount}</Td>
              <Td className="text-right tabular-nums">
                {s.avgRating !== null ? s.avgRating.toFixed(1) : "—"}
              </Td>
              <Td className="text-right tabular-nums">{s.commentCount}</Td>
              <Td className="text-right">
                <ButtonLink
                  href={`/admin/item-stats/${s.itemId}`}
                  variant="secondary"
                  size="sm"
                >
                  查看
                </ButtonLink>
              </Td>
            </tr>
          ))}
        </tbody>
      </TableWrap>

      <Pagination
        page={current}
        pageCount={pageCount}
        total={stats.length}
        pageSize={pageSize}
        onPage={setPage}
      />

      <p className="text-xs text-muted">＊此頁為介面預覽，資料為範例。</p>
    </div>
  );
}
