"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Badge,
  TableWrap,
  Th,
  Td,
  Pagination,
  ListToolbar,
  BulkActionBar,
} from "@/components/ui/primitives";
import type { GroupOrderListItem, GroupOrderStatus } from "@/lib/models/group-order";
import { setGroupOrdersStatusAction, deleteGroupOrdersAction } from "@/app/(app)/admin/group-orders/actions";

// "completed" 已經沒有任何操作會再設定它了（"設為已完成" 按鈕已移除），這裡改成
// Partial，只保留還會真的出現的兩個狀態；萬一資料庫裡還有舊的 completed 團，
// render 時用 fallback 顯示，不會因為查不到對應項目而壞掉。
const statusMap: Partial<Record<GroupOrderStatus, { label: string; tone: "positive" | "warning" | "neutral" }>> = {
  open: { label: "開放中", tone: "positive" },
  closed: { label: "已截止", tone: "warning" },
};

const filters: { label: string; test: (r: GroupOrderListItem) => boolean }[] = [
  { label: "全部", test: () => true },
  { label: "開放中", test: (r) => r.status === "open" },
  { label: "已截止", test: (r) => r.status === "closed" },
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
    <div className="space-y-4">
      <ListToolbar
        tabs={{
          tabs: filters.map((f) => ({ key: f.label, label: f.label, count: rows.filter(f.test).length })),
          value: filterLabel,
          onChange: (key) => {
            setFilterLabel(key);
            setPage(1);
          },
        }}
        pageSize={pageSize}
        onPageSizeChange={(n) => {
          setPageSize(n);
          setPage(1);
        }}
      />

      <BulkActionBar
        count={selected.size}
        unit="團"
        onCancel={() => setSelected(new Set())}
        actions={[
          { label: "開放選取", tone: "neutral", onClick: () => bulkSetStatus("open"), disabled: busy },
          { label: "截止選取", tone: "neutral", onClick: () => bulkSetStatus("closed"), disabled: busy },
          { label: "刪除選取", tone: "danger", onClick: bulkDelete, disabled: busy },
        ]}
      />

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
                <Td>{r.name}</Td>
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
                  {(() => {
                    const s = statusMap[r.status] ?? { label: r.status, tone: "neutral" as const };
                    return <Badge tone={s.tone}>{s.label}</Badge>;
                  })()}
                </Td>
              </tr>
            ))
          )}
        </tbody>
      </TableWrap>

      <Pagination page={current} pageCount={pageCount} total={filtered.length} pageSize={pageSize} onPage={setPage} unit="筆" />
    </div>
  );
}
