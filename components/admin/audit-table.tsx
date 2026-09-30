"use client";

import { useState } from "react";
import {
  Badge,
  TableWrap,
  Th,
  Td,
  Pagination,
  ListToolbar,
  inputClass,
  EmptyTableRow,
  paginate,
  DEFAULT_PAGE_SIZE,
} from "@/components/ui/primitives";
import type { AuditLogRow, AuditLogCategory } from "@/lib/models/audit-log";
import { formatTaiwanDateTime } from "@/lib/date";

type Tab = "all" | AuditLogCategory;

const categoryLabel: Record<AuditLogCategory, string> = {
  finance: "財務管理",
  people: "會員管理",
  catalog: "品項管理",
};

export function AuditTable({ logs }: { logs: AuditLogRow[] }) {
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const byCategory = tab === "all" ? logs : logs.filter((l) => l.category === tab);
  const filtered = byCategory.filter((l) => {
    const q = search.trim();
    if (!q) return true;
    return l.actor.includes(q) || l.target.includes(q) || l.action.includes(q);
  });

  const { pageRows: rows, pageCount, current, effectiveSize } = paginate(filtered, page, pageSize);

  return (
    <div className="space-y-4">
      <ListToolbar
        tabs={{
          tabs: [
            { key: "all", label: "全部", count: logs.length },
            ...(Object.entries(categoryLabel) as [AuditLogCategory, string][]).map(([key, label]) => ({
              key,
              label,
              count: logs.filter((l) => l.category === key).length,
            })),
          ],
          value: tab,
          onChange: (key) => {
            setTab(key as Tab);
            setPage(1);
          },
        }}
        pageSize={pageSize}
        onPageSizeChange={(n) => {
          setPageSize(n);
          setPage(1);
        }}
      />

      <input
        className={`${inputClass} w-full`}
        placeholder="搜尋操作者 / 對象 / 動作"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
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
            <Th className="text-right">類別</Th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <EmptyTableRow colSpan={5} message={search.trim() ? "沒有符合的紀錄。" : undefined} />
          ) : (
            rows.map((l) => (
              <tr key={l.id}>
                <Td className="text-muted">{formatTaiwanDateTime(l.at)}</Td>
                <Td>{l.actor}</Td>
                <Td>{l.action}</Td>
                <Td className="text-muted">{l.target || "—"}</Td>
                <Td className="text-right">
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
        pageSize={effectiveSize}
        onPage={setPage}
        unit="筆"
      />
    </div>
  );
}
