"use client";

import { useState } from "react";
import {
  Button,
  Badge,
  TableWrap,
  Th,
  Td,
  Pagination,
  PageSizeSelect,
  PillTabs,
} from "@/components/ui/primitives";
import {
  groupOrders as initialGroupOrders,
  groupOrderTotals,
  templateById,
  unitById,
  departmentById,
  type GroupOrder,
  type GroupOrderStatus,
} from "@/lib/mock";

const statusMap: Record<GroupOrderStatus, { label: string; tone: "positive" | "warning" | "neutral" }> = {
  open: { label: "開放中", tone: "positive" },
  closed: { label: "已截止", tone: "warning" },
  completed: { label: "已完成", tone: "neutral" },
};

const filters: { label: string; test: (r: GroupOrder) => boolean }[] = [
  { label: "全部", test: () => true },
  { label: "開放中", test: (r) => r.status === "open" },
  { label: "已截止", test: (r) => r.status === "closed" },
  { label: "已完成", test: (r) => r.status === "completed" },
];

export function GroupOrdersTable() {
  const [rows, setRows] = useState(initialGroupOrders);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [filterLabel, setFilterLabel] = useState("全部");
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  const activeFilter =
    filters.find((f) => f.label === filterLabel) ?? filters[0];
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

  const pageAllSelected =
    pageRows.length > 0 && pageRows.every((r) => selected.has(r.id));

  const togglePageAll = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (pageAllSelected) pageRows.forEach((r) => next.delete(r.id));
      else pageRows.forEach((r) => next.add(r.id));
      return next;
    });

  const bulkDelete = () => {
    setRows((prev) => prev.filter((r) => !selected.has(r.id)));
    setSelected(new Set());
  };

  const bulkSetStatus = (status: GroupOrderStatus) => {
    setRows((prev) =>
      prev.map((r) => (selected.has(r.id) ? { ...r, status } : r)),
    );
    setSelected(new Set());
  };

  const bulkExport = () => {
    setSelected(new Set());
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PillTabs
          tabs={filters.map((f) => ({
            key: f.label,
            label: f.label,
            count: rows.filter(f.test).length,
          }))}
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
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="text-muted hover:text-ink"
            >
              取消選取
            </button>
            <button
              type="button"
              onClick={bulkExport}
              className="rounded-lg border border-line px-3 py-1 font-semibold text-ink hover:bg-surface"
            >
              匯出選取
            </button>
            <button
              type="button"
              onClick={() => bulkSetStatus("open")}
              className="rounded-lg border border-line px-3 py-1 font-semibold text-ink hover:bg-surface"
            >
              開放選取
            </button>
            <button
              type="button"
              onClick={() => bulkSetStatus("closed")}
              className="rounded-lg border border-line px-3 py-1 font-semibold text-ink hover:bg-surface"
            >
              截止選取
            </button>
            <button
              type="button"
              onClick={() => bulkSetStatus("completed")}
              className="rounded-lg border border-line px-3 py-1 font-semibold text-ink hover:bg-surface"
            >
              完成選取
            </button>
            <button
              type="button"
              onClick={bulkDelete}
              className="rounded-lg border border-danger/40 px-3 py-1 font-semibold text-danger hover:bg-danger/10"
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
              <input
                type="checkbox"
                checked={pageAllSelected}
                onChange={togglePageAll}
                aria-label="選取本頁全部"
              />
            </Th>
            <Th>團名</Th>
            <Th>部門 / 單位</Th>
            <Th>套用模板</Th>
            <Th>團主</Th>
            <Th>日期</Th>
            <Th className="text-right">份數</Th>
            <Th className="text-right">金額</Th>
            <Th>狀態</Th>
            <Th className="text-right">操作</Th>
          </tr>
        </thead>
        <tbody>
          {pageRows.map((r) => {
            const totals = groupOrderTotals(r);
            const unit = unitById(r.unitId);
            const dept = unit ? departmentById(unit.departmentId) : undefined;
            return (
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
                    <Badge tone="brand">{dept?.name ?? "—"}</Badge>
                    <span className="text-muted">{unit?.name ?? "—"}</span>
                  </div>
                </Td>
                <Td className="text-muted">{templateById(r.templateId)?.name ?? r.templateId}</Td>
                <Td className="text-muted">{r.host}</Td>
                <Td className="tabular-nums">{r.date}</Td>
                <Td className="text-right tabular-nums">{totals.qty}</Td>
                <Td className="text-right tabular-nums">NT$ {totals.amount}</Td>
                <Td>
                  <Badge tone={statusMap[r.status].tone}>
                    {statusMap[r.status].label}
                  </Badge>
                </Td>
                <Td className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" size="sm">
                      匯出
                    </Button>
                    <Button size="sm">結算</Button>
                  </div>
                </Td>
              </tr>
            );
          })}
        </tbody>
      </TableWrap>

      <Pagination
        page={current}
        pageCount={pageCount}
        total={filtered.length}
        pageSize={pageSize}
        onPage={setPage}
        unit="團"
      />

      <p className="text-xs text-muted">
        ＊同一個模板可以同時被多個單位各自開團(見上表「套用模板」欄有重複值)；此頁為介面預覽，資料為範例。
      </p>
    </div>
  );
}
