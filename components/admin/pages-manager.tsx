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
  ListToolbar,
  BulkActionBar,
  Note,
} from "@/components/ui/primitives";
import { AdminHeaderActions } from "@/components/layout/admin-header-actions";
import { formatTaiwanDateTime } from "@/lib/date";
import type { PageView } from "@/lib/models/page";
import { setPagesActiveAction, deletePagesAction } from "@/app/(app)/admin/pages/actions";

export function PagesManager({ pages }: { pages: PageView[] }) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletedMessage, setDeletedMessage] = useState<string | null>(null);

  const pageCount = Math.max(1, Math.ceil(pages.length / pageSize));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * pageSize;
  const rows = pages.slice(start, start + pageSize);

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
    await setPagesActiveAction([...selected], active);
    setSelected(new Set());
    setBusy(false);
    router.refresh();
  }

  async function toggleActive(s: PageView) {
    setBusy(true);
    await setPagesActiveAction([s.id], !s.active);
    setBusy(false);
    router.refresh();
  }

  async function bulkDelete() {
    setDeleting(true);
    const count = selected.size;
    await deletePagesAction([...selected]);
    setSelected(new Set());
    setDeleting(false);
    setDeletedMessage(`已刪除 ${count} 筆資料`);
    setTimeout(() => setDeletedMessage(null), 3000);
    router.refresh();
  }

  return (
    <Section>
      <AdminHeaderActions>
        <ButtonLink href="/admin/pages/new" size="sm">新增頁面</ButtonLink>
      </AdminHeaderActions>

      <ListToolbar
        pageSize={pageSize}
        onPageSizeChange={(n) => {
          setPageSize(n);
          setPage(1);
        }}
      />

      {deletedMessage && <Note tone="danger">{deletedMessage}</Note>}

      <BulkActionBar
        count={selected.size}
        unit="家"
        onCancel={() => setSelected(new Set())}
        actions={[
          { label: "啟用選取", tone: "neutral", onClick: () => bulkSetActive(true), disabled: busy || deleting },
          { label: "停用選取", tone: "neutral", onClick: () => bulkSetActive(false), disabled: busy || deleting },
          { label: deleting ? "刪除中…" : "刪除選取", tone: "danger", onClick: bulkDelete, disabled: busy || deleting },
        ]}
      />

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
              <Td>{s.name}</Td>
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
                目前沒有資料
              </Td>
            </tr>
          )}
        </tbody>
      </TableWrap>

      <Pagination page={current} pageCount={pageCount} total={pages.length} pageSize={pageSize} onPage={setPage} unit="筆" />
    </Section>
  );
}
