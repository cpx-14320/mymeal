"use client";

import { useState } from "react";
import {
  TableWrap,
  Th,
  Td,
  Pagination,
  PageSizeSelect,
} from "@/components/ui/primitives";
import type { ItemCommentEntry } from "@/lib/mock";

function stars(n: number) {
  return "★".repeat(n) + "☆".repeat(5 - n);
}

export function ItemCommentsTable({
  comments,
}: {
  comments: ItemCommentEntry[];
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const pageCount = Math.max(1, Math.ceil(comments.length / pageSize));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * pageSize;
  const rows = comments.slice(start, start + pageSize);

  if (comments.length === 0) {
    return <p className="text-sm text-muted">尚未有任何評論。</p>;
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
              <Td className="font-medium">{c.memberName}</Td>
              <Td className="text-muted">{c.text}</Td>
              <Td className="text-warning">{stars(c.stars)}</Td>
              <Td className="whitespace-nowrap text-muted">{c.at}</Td>
            </tr>
          ))}
        </tbody>
      </TableWrap>

      <Pagination
        page={current}
        pageCount={pageCount}
        total={comments.length}
        pageSize={pageSize}
        onPage={setPage}
        unit="則"
      />
    </div>
  );
}
