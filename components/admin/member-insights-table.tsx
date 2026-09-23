"use client";

import { useState } from "react";
import {
  ButtonLink,
  TableWrap,
  Th,
  Td,
  Pagination,
  ListToolbar,
} from "@/components/ui/primitives";
import type { MemberListItem } from "@/lib/models/member";

export function MemberInsightsTable({
  members,
  favoriteCounts,
  ratingCounts,
  commentCounts,
  balances,
}: {
  members: MemberListItem[];
  favoriteCounts: Record<string, number>;
  ratingCounts: Record<string, number>;
  commentCounts: Record<string, number>;
  balances: Record<string, number>;
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const pageCount = Math.max(1, Math.ceil(members.length / pageSize));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * pageSize;
  const rows = members.slice(start, start + pageSize);

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
            <Th>姓名</Th>
            <Th>帳號</Th>
            <Th className="text-right">訂單數</Th>
            <Th className="text-right">便當數</Th>
            <Th className="text-right">收藏</Th>
            <Th className="text-right">評論</Th>
            <Th className="text-right">評分</Th>
            <Th className="text-right">剩餘儲值</Th>
            <Th className="text-right">操作</Th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <Td colSpan={9} className="text-center text-muted">
                目前沒有會員資料。
              </Td>
            </tr>
          ) : (
            rows.map((m) => (
              <tr key={m.id}>
                <Td>{m.name}</Td>
                <Td className="text-muted">{m.account}</Td>
                <Td className="text-right tabular-nums">0</Td>
                <Td className="text-right tabular-nums">0</Td>
                <Td className="text-right tabular-nums">{favoriteCounts[m.id] ?? 0}</Td>
                <Td className="text-right tabular-nums">{commentCounts[m.id] ?? 0}</Td>
                <Td className="text-right tabular-nums">{ratingCounts[m.id] ?? 0}</Td>
                <Td className="text-right tabular-nums">NT$ {balances[m.id] ?? 0}</Td>
                <Td className="text-right">
                  <ButtonLink
                    href={`/admin/insights/${m.id}`}
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
        total={members.length}
        pageSize={pageSize}
        onPage={setPage}
        unit="筆"
      />
    </div>
  );
}
