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
import { members, memberInsightSummary } from "@/lib/mock";

export function MemberInsightsTable() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const pageCount = Math.max(1, Math.ceil(members.length / pageSize));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * pageSize;
  const rows = members.slice(start, start + pageSize);

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
          {rows.map((m) => {
            const s = memberInsightSummary(m.id);
            return (
              <tr key={m.id}>
                <Td className="font-medium">{m.name}</Td>
                <Td className="text-muted">{m.account}</Td>
                <Td className="text-right tabular-nums">{s.orderCount}</Td>
                <Td className="text-right tabular-nums">{s.mealCount}</Td>
                <Td className="text-right tabular-nums">{s.favoriteCount}</Td>
                <Td className="text-right tabular-nums">{s.commentCount}</Td>
                <Td className="text-right tabular-nums">{s.ratingCount}</Td>
                <Td className="text-right tabular-nums">NT$ {s.balance}</Td>
                <Td className="text-right">
                  <ButtonLink
                    href={`/admin/members/insights/${m.id}`}
                    variant="secondary"
                    size="sm"
                  >
                    查看
                  </ButtonLink>
                </Td>
              </tr>
            );
          })}
        </tbody>
      </TableWrap>

      <Pagination
        page={current}
        pageCount={pageCount}
        total={members.length}
        pageSize={pageSize}
        onPage={setPage}
        unit="人"
      />

      <p className="text-xs text-muted">＊此頁為介面預覽，資料為範例。</p>
    </div>
  );
}
