"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Section,
  Button,
  ButtonLink,
  Badge,
  TableWrap,
  Th,
  Td,
  Pagination,
  PageSizeSelect,
} from "@/components/ui/primitives";
import type { TemplateListItem } from "@/lib/models/template";
import { formatTaiwanDateTime } from "@/lib/date";
import { setTemplatesActiveAction, deleteTemplatesAction } from "@/app/(app)/admin/templates/actions";

export function TemplatesList({ templates }: { templates: TemplateListItem[] }) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [busy, setBusy] = useState(false);

  const pageCount = Math.max(1, Math.ceil(templates.length / pageSize));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * pageSize;
  const rows = templates.slice(start, start + pageSize);

  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const pageAllSelected = rows.length > 0 && rows.every((t) => selected.has(t.id));

  const togglePageAll = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (pageAllSelected) rows.forEach((t) => next.delete(t.id));
      else rows.forEach((t) => next.add(t.id));
      return next;
    });

  async function bulkSetActive(active: boolean) {
    setBusy(true);
    await setTemplatesActiveAction([...selected], active);
    setSelected(new Set());
    setBusy(false);
    router.refresh();
  }

  async function bulkDelete() {
    setBusy(true);
    await deleteTemplatesAction([...selected]);
    setSelected(new Set());
    setBusy(false);
    router.refresh();
  }

  async function toggleActive(t: TemplateListItem) {
    setBusy(true);
    await setTemplatesActiveAction([t.id], !t.active);
    setBusy(false);
    router.refresh();
  }

  return (
    <Section
      title="模板"
      description="可重用的訂購藍圖：模板 → 分類 → 品項。開團時選一個模板 + 分類。"
      actions={<ButtonLink href="/admin/templates/new">新增模板</ButtonLink>}
    >
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
            已選 <b className="tabular-nums">{selected.size}</b> 個
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
            <Th>模板</Th>
            <Th>類型</Th>
            <Th>分類數</Th>
            <Th>品項數</Th>
            <Th>狀態</Th>
            <Th>建立者</Th>
            <Th>建立時間</Th>
            <Th className="text-right">操作</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => {
            const itemCount = t.sections.reduce((n, s) => n + s.itemCount, 0);
            return (
              <tr key={t.id} className={selected.has(t.id) ? "bg-brand-soft" : ""}>
                <Td>
                  <input
                    type="checkbox"
                    checked={selected.has(t.id)}
                    onChange={() => toggleOne(t.id)}
                    aria-label={`選取 ${t.name}`}
                  />
                </Td>
                <Td className="font-medium">
                  <Link href={`/admin/templates/${t.id}`} className="hover:text-brand">
                    {t.name}
                  </Link>
                </Td>
                <Td>
                  <Badge tone="brand">{t.kindName}</Badge>
                </Td>
                <Td className="tabular-nums text-muted">{t.sections.length}</Td>
                <Td className="tabular-nums text-muted">{itemCount}</Td>
                <Td>
                  <Badge tone={t.active ? "positive" : "neutral"}>{t.active ? "啟用" : "停用"}</Badge>
                </Td>
                <Td className="text-muted">{t.createdBy}</Td>
                <Td className="whitespace-nowrap text-muted">{formatTaiwanDateTime(t.createdAt)}</Td>
                <Td className="text-right">
                  <div className="flex justify-end gap-2">
                    <ButtonLink href={`/admin/templates/${t.id}`} variant="secondary" size="sm">
                      編輯
                    </ButtonLink>
                    <Button variant="secondary" size="sm" disabled={busy} onClick={() => toggleActive(t)}>
                      {t.active ? "停用" : "啟用"}
                    </Button>
                  </div>
                </Td>
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr>
              <Td className="text-center text-muted" colSpan={9}>
                還沒有模板，點右上角「新增模板」開始建立。
              </Td>
            </tr>
          )}
        </tbody>
      </TableWrap>

      <Pagination page={current} pageCount={pageCount} total={templates.length} pageSize={pageSize} onPage={setPage} unit="個" />
    </Section>
  );
}
