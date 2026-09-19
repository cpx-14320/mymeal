"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Badge,
  TableWrap,
  Th,
  Td,
  Pagination,
  PageSizeSelect,
  PillTabs,
} from "@/components/ui/primitives";
import type { GroupOrderListItem, GroupOrderStatus } from "@/lib/models/group-order";
import { setGroupOrdersStatusAction, deleteGroupOrdersAction } from "@/app/(app)/admin/group-orders/actions";

const statusMap: Record<GroupOrderStatus, { label: string; tone: "positive" | "warning" | "neutral" }> = {
  open: { label: "開放中", tone: "positive" },
  closed: { label: "已截止", tone: "warning" },
  completed: { label: "已完成", tone: "neutral" },
};

const filters: { label: string; test: (r: GroupOrderListItem) => boolean }[] = [
  { label: "全部", test: () => true },
  { label: "開放中", test: (r) => r.status === "open" },
  { label: "已截止", test: (r) => r.status === "closed" },
  { label: "已完成", test: (r) => r.status === "completed" },
];

export function GroupOrdersTable({ rows }: { rows: GroupOrderListItem[] }) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [filterLabel, setFilterLabel] = useState("全部");
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [busy, setBusy] = useState(false);

  const activeFilter = filters.find((f) => f.label === filterLabel) ?? filters[0];
  const filtered = rows.filter(activeFilter.test);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * pageSize;
  const pageRows = filtered.slice(start, start + pageSize);

  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const pageAllSelected = pageRows.length > 0 && pageRows.every((r) => selected.has(r.id));

  const togglePageAll = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (pageAllSelected) pageRows.forEach((r) => next.delete(r.id));
      else pageRows.forEach((r) => next.add(r.id));
      return next;
    });

  async function bulkSetStatus(status: GroupOrderStatus) {
    setBusy(true);
    await setGroupOrdersStatusAction([...selected], status);
    setSelected(new Set());
    setBusy(false);
    router.refresh();
  }

  async function bulkDelete() {
    setBusy(true);
    await deleteGroupOrdersAction([...selected]);
    setSelected(new Set());
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PillTabs
          tabs={filters.map((f) => ({ key: f.label, label: f.label, count: rows.filter(f.test).length }))}
          value={filterLabel}
          onChange={(key) => {
            setFilterLabel(key);
            setPage(1);
          }}
        />
        <PageSizeSelect
          value={pageSize}
          onChange={(n) => {
            setPageSize(n);
            setPage(1);
          }}
        />
      </div>

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface-2 px-4 py-2.5 text-sm">
          <span>
            已選 <b className="tabular-nums">{selected.size}</b> 團
          </span>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setSelected(new Set())} className="text-muted hover:text-ink">
              取消選取
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => bulkSetStatus("open")}
              className="rounded-lg border border-line px-3 py-1 font-semibold text-ink hover:bg-surface disabled:opacity-50"
            >
              開放選取
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => bulkSetStatus("closed")}
              className="rounded-lg border border-line px-3 py-1 font-semibold text-ink hover:bg-surface disabled:opacity-50"
            >
              截止選取
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => bulkSetStatus("completed")}
              className="rounded-lg border border-line px-3 py-1 font-semibold text-ink hover:bg-surface disabled:opacity-50"
            >
              完成選取
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={bulkDelete}
              className="rounded-lg border border-danger/40 px-3 py-1 font-semibold text-danger hover:bg-danger/10 disabled:opacity-50"
            >
              刪除選取
            </button>
          </div>
        </div>
      )}

      <TableWrap>
        <thead>
          <tr>
            <Th className="w-10">
              <input type="checkbox" checked={pageAllSelected} onChange={togglePageAll} aria-label="選取本頁全部" />
            </Th>
            <Th>團名</Th>
            <Th>部門 / 單位</Th>
            <Th>套用模板</Th>
            <Th>團主</Th>
            <Th>日期</Th>
            <Th className="text-right">份數</Th>
            <Th className="text-right">金額</Th>
            <Th>狀態</Th>
          </tr>
        </thead>
        <tbody>
          {pageRows.length === 0 ? (
            <tr>
              <Td colSpan={9} className="text-center text-muted">
                還沒有任何團訂。
              </Td>
            </tr>
          ) : (
            pageRows.map((r) => (
              <tr key={r.id} className={selected.has(r.id) ? "bg-brand-soft" : ""}>
                <Td>
                  <input
                    type="checkbox"
                    checked={selected.has(r.id)}
                    onChange={() => toggleOne(r.id)}
                    aria-label={`選取 ${r.name}`}
                  />
                </Td>
                <Td className="font-medium">{r.name}</Td>
                <Td>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge tone="brand">{r.departmentName || "—"}</Badge>
                    <span className="text-muted">{r.unitName}</span>
                  </div>
                </Td>
                <Td className="text-muted">{r.templateName}</Td>
                <Td className="text-muted">{r.hostName}</Td>
                <Td className="tabular-nums">{r.date}</Td>
                <Td className="text-right tabular-nums">{r.qty}</Td>
                <Td className="text-right tabular-nums">NT$ {r.amount}</Td>
                <Td>
                  <Badge tone={statusMap[r.status].tone}>{statusMap[r.status].label}</Badge>
                </Td>
              </tr>
            ))
          )}
        </tbody>
      </TableWrap>

      <Pagination page={current} pageCount={pageCount} total={filtered.length} pageSize={pageSize} onPage={setPage} unit="團" />
    </div>
  );
}
