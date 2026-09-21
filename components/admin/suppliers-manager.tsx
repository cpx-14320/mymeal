"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Section,
  Badge,
  Button,
  ButtonLink,
  TableWrap,
  Th,
  Td,
  Pagination,
  PageSizeSelect,
} from "@/components/ui/primitives";
import { AdminHeaderActions } from "@/components/layout/admin-header-actions";
import { formatTaiwanDateTime } from "@/lib/date";
import type { SupplierView } from "@/lib/models/supplier";
import { setSuppliersActiveAction, deleteSuppliersAction } from "@/app/(app)/admin/pages/actions";

export function SuppliersManager({ suppliers }: { suppliers: SupplierView[] }) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [busy, setBusy] = useState(false);

  const pageCount = Math.max(1, Math.ceil(suppliers.length / pageSize));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * pageSize;
  const rows = suppliers.slice(start, start + pageSize);

  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const pageAllSelected = rows.length > 0 && rows.every((s) => selected.has(s.id));

  const togglePageAll = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (pageAllSelected) rows.forEach((s) => next.delete(s.id));
      else rows.forEach((s) => next.add(s.id));
      return next;
    });

  async function bulkSetActive(active: boolean) {
    setBusy(true);
    await setSuppliersActiveAction([...selected], active);
    setSelected(new Set());
    setBusy(false);
    router.refresh();
  }

  async function toggleActive(s: SupplierView) {
    setBusy(true);
    await setSuppliersActiveAction([s.id], !s.active);
    setBusy(false);
    router.refresh();
  }

  async function bulkDelete() {
    setBusy(true);
    await deleteSuppliersAction([...selected]);
    setSelected(new Set());
    setBusy(false);
    router.refresh();
  }

  return (
    <Section>
      <AdminHeaderActions>
        <ButtonLink href="/admin/pages/new">新增頁面</ButtonLink>
      </AdminHeaderActions>

      <div className="flex items-center justify-end gap-3">
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
            已選 <b className="tabular-nums">{selected.size}</b> 家
          </span>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setSelected(new Set())} className="text-muted hover:text-ink">
              取消選取
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => bulkSetActive(true)}
              className="rounded-lg border border-line px-3 py-1 font-semibold text-ink hover:bg-surface disabled:opacity-50"
            >
              啟用選取
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => bulkSetActive(false)}
              className="rounded-lg border border-line px-3 py-1 font-semibold text-ink hover:bg-surface disabled:opacity-50"
            >
              停用選取
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
            <Th>名稱</Th>
            <Th>網址代稱</Th>
            <Th>排序</Th>
            <Th>狀態</Th>
            <Th>本頁開啟</Th>
            <Th>建立者</Th>
            <Th>最後更新時間</Th>
            <Th className="text-right">操作</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => (
            <tr key={s.id} className={selected.has(s.id) ? "bg-brand-soft" : ""}>
              <Td>
                <input
                  type="checkbox"
                  checked={selected.has(s.id)}
                  onChange={() => toggleOne(s.id)}
                  aria-label={`選取 ${s.name}`}
                />
              </Td>
              <Td className="font-medium">{s.name}</Td>
              <Td className="text-muted">{s.slug}</Td>
              <Td className="tabular-nums text-muted">{s.sortOrder}</Td>
              <Td>
                <Badge tone={s.active ? "positive" : "neutral"}>{s.active ? "啟用" : "停用"}</Badge>
              </Td>
              <Td className="text-muted">{s.openInNewTab ? "否" : "是"}</Td>
              <Td className="text-muted">{s.createdBy}</Td>
              <Td className="text-muted">{formatTaiwanDateTime(s.updatedAt)}</Td>
              <Td className="text-right">
                <div className="flex justify-end gap-2">
                  <ButtonLink href={`/admin/pages/${s.id}`} variant="secondary" size="sm">
                    編輯
                  </ButtonLink>
                  <Button variant="secondary" size="sm" disabled={busy} onClick={() => toggleActive(s)}>
                    {s.active ? "停用" : "啟用"}
                  </Button>
                </div>
              </Td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <Td className="text-center text-muted" colSpan={9}>
                還沒有頁面資料，點右上角「新增頁面」開始建立。
              </Td>
            </tr>
          )}
        </tbody>
      </TableWrap>

      <Pagination page={current} pageCount={pageCount} total={suppliers.length} pageSize={pageSize} onPage={setPage} unit="筆" />
    </Section>
  );
}
