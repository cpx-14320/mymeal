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
  DEFAULT_PAGE_SIZE,
  ItemLabel,
} from "@/components/ui/primitives";
import type { CatalogItemStat } from "@/lib/models/catalog-item";

export function ItemStatsTable({ stats }: { stats: CatalogItemStat[] }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

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
            <Th>價格</Th>
            <Th>總訂購數量</Th>
            <Th>被訂購次數</Th>
            <Th>平均評分</Th>
            <Th>評論數</Th>
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
                <Td>
                  <ItemLabel imageUrl={s.imageUrl} emoji={s.emoji} name={s.itemName} />
                </Td>
                <Td className="tabular-nums">NT$ {s.price}</Td>
                <Td className="tabular-nums">{s.totalQuantity}</Td>
                <Td className="tabular-nums">{s.orderCount}</Td>
                <Td className="tabular-nums">
                  {s.avgRating !== null ? s.avgRating.toFixed(1) : "—"}
                </Td>
                <Td className="tabular-nums">{s.commentCount}</Td>
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
