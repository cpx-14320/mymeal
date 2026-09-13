"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Button,
  ButtonLink,
  Badge,
  TableWrap,
  Th,
  Td,
  Pagination,
  PageSizeSelect,
} from "@/components/ui/primitives";
import {
  templates as initialTemplates,
  templateKindLabel,
  supplierById,
} from "@/lib/mock";

export function TemplatesList() {
  const [templates, setTemplates] = useState(() => initialTemplates);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

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

  const pageAllSelected =
    rows.length > 0 && rows.every((t) => selected.has(t.id));

  const togglePageAll = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (pageAllSelected) rows.forEach((t) => next.delete(t.id));
      else rows.forEach((t) => next.add(t.id));
      return next;
    });

  const bulkSetActive = (active: boolean) => {
    setTemplates((prev) =>
      prev.map((t) => (selected.has(t.id) ? { ...t, active } : t)),
    );
    setSelected(new Set());
  };

  const bulkDelete = () => {
    setTemplates((prev) => prev.filter((t) => !selected.has(t.id)));
    setSelected(new Set());
  };

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

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface-2 px-4 py-2.5 text-sm">
          <span>
            已選 <b className="tabular-nums">{selected.size}</b> 個
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
              onClick={() => bulkSetActive(true)}
              className="rounded-lg border border-line px-3 py-1 font-semibold text-ink hover:bg-surface"
            >
              啟用選取
            </button>
            <button
              type="button"
              onClick={() => bulkSetActive(false)}
              className="rounded-lg border border-line px-3 py-1 font-semibold text-ink hover:bg-surface"
            >
              停用選取
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
            <Th>模板</Th>
            <Th>類型</Th>
            <Th>分類</Th>
            <Th>狀態</Th>
            <Th className="text-right">操作</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => {
            const itemCount = t.sections.reduce(
              (n, s) => n + s.itemIds.length,
              0,
            );
            const supplier = supplierById(t.supplierId);
            return (
              <tr
                key={t.id}
                className={selected.has(t.id) ? "bg-brand-soft" : ""}
              >
                <Td>
                  <input
                    type="checkbox"
                    checked={selected.has(t.id)}
                    onChange={() => toggleOne(t.id)}
                    aria-label={`選取 ${t.name}`}
                  />
                </Td>
                <Td className="font-medium">
                  <Link
                    href={`/admin/templates/${t.id}`}
                    className="hover:text-brand"
                  >
                    {t.name}
                  </Link>
                  <p className="mt-0.5 text-xs font-normal text-muted">
                    {supplier ? supplier.name : "多家店家"}
                  </p>
                </Td>
                <Td>
                  <Badge tone="brand">{templateKindLabel[t.kind]}</Badge>
                </Td>
                <Td>
                  <div className="flex max-w-xs flex-wrap gap-1.5">
                    {t.sections.map((s) => (
                      <span
                        key={s.id}
                        className="rounded-md bg-surface-2 px-2 py-0.5 text-xs text-muted"
                      >
                        {s.name}
                        <span className="ml-1 tabular-nums">
                          {s.itemIds.length}
                        </span>
                      </span>
                    ))}
                  </div>
                  <p className="mt-1 text-[11px] text-muted">
                    {t.sections.length} 個分類．{itemCount} 個品項
                  </p>
                </Td>
                <Td>
                  <Badge tone={t.active ? "positive" : "neutral"}>
                    {t.active ? "啟用" : "停用"}
                  </Badge>
                </Td>
                <Td className="text-right">
                  <div className="flex justify-end gap-2">
                    <ButtonLink
                      href={`/admin/templates/${t.id}`}
                      variant="secondary"
                      size="sm"
                    >
                      編輯
                    </ButtonLink>
                    <Button variant="secondary" size="sm">
                      複製
                    </Button>
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
        total={templates.length}
        pageSize={pageSize}
        onPage={setPage}
        unit="個"
      />

      <p className="text-xs text-muted">＊此頁為介面預覽，資料為範例。</p>
    </div>
  );
}
