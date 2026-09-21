"use client";

import { useMemo, useState } from "react";
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
import { AdminHeaderActions } from "@/components/layout/admin-header-actions";
import type { TemplateListItem } from "@/lib/models/template";
import { formatTaiwanDateTime } from "@/lib/date";
import { setTemplatesActiveAction, deleteTemplatesAction } from "@/app/(app)/admin/templates/actions";

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export function TemplatesList({ templates }: { templates: TemplateListItem[] }) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [year, setYear] = useState<number | "all">("all");
  const [month, setMonth] = useState<number | "all">("all");
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [busy, setBusy] = useState(false);

  // 依「模板建立時間」篩選——目前模板沒有另外記錄「這是哪一週的菜單」，
  // 以每週建立一個模板的實際節奏來看，建立時間可以直接當作篩選依據。
  const years = useMemo(() => {
    const all = templates.map((t) => t.createdAt.getFullYear());
    return [...new Set(all)].sort((a, b) => b - a);
  }, [templates]);

  const filteredTemplates = templates.filter(
    (t) =>
      (year === "all" || t.createdAt.getFullYear() === year) &&
      (month === "all" || t.createdAt.getMonth() + 1 === month),
  );

  const pageCount = Math.max(1, Math.ceil(filteredTemplates.length / pageSize));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * pageSize;
  const rows = filteredTemplates.slice(start, start + pageSize);

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
    <Section>
      <AdminHeaderActions>
        <ButtonLink href="/admin/templates/new">新增模板</ButtonLink>
      </AdminHeaderActions>

      <div className="flex items-center justify-end gap-2 text-xs text-muted">
        <PageSizeSelect
          value={pageSize}
          onChange={(n) => {
            setPageSize(n);
            setPage(1);
          }}
        />
        <select
          value={year}
          onChange={(e) => {
            setYear(e.target.value === "all" ? "all" : Number(e.target.value));
            setPage(1);
          }}
          className="rounded-lg border border-line bg-surface px-2 py-1 text-xs text-ink outline-none focus:border-brand"
          aria-label="篩選年份"
        >
          <option value="all">全部年份</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <select
          value={month}
          onChange={(e) => {
            setMonth(e.target.value === "all" ? "all" : Number(e.target.value));
            setPage(1);
          }}
          className="rounded-lg border border-line bg-surface px-2 py-1 text-xs text-ink outline-none focus:border-brand"
          aria-label="篩選月份"
        >
          <option value="all">全部月份</option>
          {MONTHS.map((m) => (
            <option key={m} value={m}>
              {m} 月
            </option>
          ))}
        </select>
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
                {templates.length === 0
                  ? "還沒有模板，點右上角「新增模板」開始建立。"
                  : "這個範圍內沒有模板。"}
              </Td>
            </tr>
          )}
        </tbody>
      </TableWrap>

      <Pagination page={current} pageCount={pageCount} total={filteredTemplates.length} pageSize={pageSize} onPage={setPage} unit="筆" />
    </Section>
  );
}
