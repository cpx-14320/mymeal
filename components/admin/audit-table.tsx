"use client";

import { useState } from "react";
import {
  Badge,
  TableWrap,
  Th,
  Td,
  Pagination,
  ListToolbar,
} from "@/components/ui/primitives";
import type { AuditLogRow } from "@/lib/models/audit-log";
import { formatTaiwanDateTime } from "@/lib/date";

export function AuditTable({ logs }: { logs: AuditLogRow[] }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const filtered = logs.filter((l) => {
    const q = search.trim();
    if (!q) return true;
    return l.actor.includes(q) || l.target.includes(q) || l.action.includes(q);
  });

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * pageSize;
  const rows = filtered.slice(start, start + pageSize);

  return (
    <div className="space-y-4">
      <ListToolbar
        search={{
          value: search,
          onChange: (v) => {
            setSearch(v);
            setPage(1);
          },
          placeholder: "搜尋操作者 / 對象 / 動作",
        }}
        pageSize={pageSize}
        onPageSizeChange={(n) => {
          setPageSize(n);
          setPage(1);
        }}
      />

      <TableWrap>
        <thead>
          <tr>
            <Th>時間</Th>
            <Th>操作者</Th>
            <Th>動作</Th>
            <Th>對象</Th>
            <Th>類別</Th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <Td colSpan={5} className="text-center text-muted">
                {logs.length === 0 ? "還沒有稽核紀錄，執行高風險操作（如手動調整餘額、停權會員）後會自動記錄在這裡。" : "沒有符合的紀錄。"}
              </Td>
            </tr>
          ) : (
            rows.map((l) => (
              <tr key={l.id}>
                <Td className="text-muted">{formatTaiwanDateTime(l.at)}</Td>
                <Td>{l.actor}</Td>
                <Td>{l.action}</Td>
                <Td className="text-muted">{l.target || "—"}</Td>
                <Td>
                  <Badge tone={l.risk ? "danger" : "neutral"}>{l.risk ? "高風險" : "一般"}</Badge>
                </Td>
              </tr>
            ))
          )}
        </tbody>
      </TableWrap>

      <Pagination
        page={current}
        pageCount={pageCount}
        total={filtered.length}
        pageSize={pageSize}
        onPage={setPage}
        unit="筆"
      />
    </div>
  );
}
