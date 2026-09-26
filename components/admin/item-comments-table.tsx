"use client";

import { useState } from "react";
import {
  TableWrap,
  Th,
  Td,
  Pagination,
  ListToolbar,
  paginate,
  DEFAULT_PAGE_SIZE,
} from "@/components/ui/primitives";
import { formatTaiwanDateTime } from "@/lib/date";
import type { ItemReviewEntry } from "@/lib/models/item-review";

function stars(n: number) {
  return "★".repeat(n) + "☆".repeat(5 - n);
}

export function ItemCommentsTable({
  comments,
}: {
  comments: ItemReviewEntry[];
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const { pageRows: rows, pageCount, current, effectiveSize } = paginate(comments, page, pageSize);

  if (comments.length === 0) {
    return <p className="text-[13px] lg:text-[14px] text-muted">尚未有任何評論。</p>;
  }

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
            <Th>會員</Th>
            <Th>留言</Th>
            <Th>評分</Th>
            <Th>時間</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c, i) => (
            <tr key={i}>
              <Td>{c.memberName}</Td>
              <Td className="text-muted">{c.text}</Td>
              <Td className="text-warning">{stars(c.stars)}</Td>
              <Td className="text-muted">{formatTaiwanDateTime(c.at)}</Td>
            </tr>
          ))}
        </tbody>
      </TableWrap>

      <Pagination
        page={current}
        pageCount={pageCount}
        total={comments.length}
        pageSize={effectiveSize}
        onPage={setPage}
        unit="筆"
      />
    </div>
  );
}
