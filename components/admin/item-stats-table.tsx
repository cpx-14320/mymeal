"use client";

import { useState } from "react";
import {
  ButtonLink,
  TableWrap,
  Th,
  Td,
  Pagination,
  ListToolbar,
  paginate,
} from "@/components/ui/primitives";
import type { CatalogItemStat } from "@/lib/models/catalog-item";

export function ItemStatsTable({ stats }: { stats: CatalogItemStat[] }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const { pageRows: rows, pageCount, current, effectiveSize } = paginate(stats, page, pageSize);

  return (
    <div className="space-y-4">
      <ListToolbar
        pageSize={pageSize}
        onPageSizeChange={(n) => {
          setPageSize(n);
          setPage(1);
        }}
      />

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
          {rows.length === 0 ? (
            <tr>
              <Td colSpan={7} className="text-center text-muted">
                目前沒有品項統計資料。
              </Td>
            </tr>
          ) : (
            rows.map((s) => (
              <tr key={s.itemId}>
                <Td>{s.itemName}</Td>
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
            ))
          )}
        </tbody>
      </TableWrap>

      <Pagination
        page={current}
        pageCount={pageCount}
        total={stats.length}
        pageSize={effectiveSize}
        onPage={setPage}
      />
    </div>
  );
}
