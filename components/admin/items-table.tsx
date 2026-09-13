"use client";

import { useState } from "react";
import {
  Badge,
  Button,
  ButtonLink,
  TableWrap,
  Th,
  Td,
  Pagination,
  PageSizeSelect,
  PillTabs,
} from "@/components/ui/primitives";
import {
  catalogItems,
  supplierById,
  type CatalogItem,
  type ItemKind,
} from "@/lib/mock";

type Filter = "all" | ItemKind;

const tabs: { key: Filter; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "meal", label: "餐點" },
  { key: "drink", label: "飲料" },
  { key: "snack", label: "點心" },
];

export function ItemsTable() {
  const [items, setItems] = useState<CatalogItem[]>(() => catalogItems);
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  const rows = items.filter((it) => filter === "all" || it.kind === filter);

  const countOf = (f: Filter) =>
    f === "all" ? items.length : items.filter((it) => it.kind === f).length;

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * pageSize;
  const pageRows = rows.slice(start, start + pageSize);

  const pick = (f: Filter) => {
    setFilter(f);
    setPage(1);
  };

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

  const bulkSetActive = (active: boolean) => {
    setItems((prev) =>
      prev.map((it) => (selected.has(it.id) ? { ...it, active } : it)),
    );
    setSelected(new Set());
  };

  const toggleActive = (id: string) =>
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, active: !it.active } : it)),
    );

  const bulkDelete = () => {
    setItems((prev) => prev.filter((it) => !selected.has(it.id)));
    setSelected(new Set());
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PillTabs
          tabs={tabs.map((t) => ({ ...t, count: countOf(t.key) }))}
          value={filter}
          onChange={pick}
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
            已選 <b className="tabular-nums">{selected.size}</b> 項
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
            <Th>品項</Th>
            <Th>分類</Th>
            <Th>店家</Th>
            <Th className="text-right">預設價</Th>
            <Th>標籤</Th>
            <Th>狀態</Th>
            <Th className="text-right">操作</Th>
          </tr>
        </thead>
        <tbody>
          {pageRows.map((it) => (
            <tr key={it.id} className={selected.has(it.id) ? "bg-brand-soft" : ""}>
              <Td>
                <input
                  type="checkbox"
                  checked={selected.has(it.id)}
                  onChange={() => toggleOne(it.id)}
                  aria-label={`選取 ${it.name}`}
                />
              </Td>
              <Td className="font-medium">
                <span className="mr-1.5">{it.emoji}</span>
                {it.name}
              </Td>
              <Td className="text-muted">{it.category}</Td>
              <Td className="text-muted">{supplierById(it.supplierId)?.name}</Td>
              <Td className="text-right tabular-nums">NT$ {it.price}</Td>
              <Td className="text-muted">
                {it.tags.length ? it.tags.join("、") : "—"}
              </Td>
              <Td>
                <Badge tone={it.active ? "positive" : "neutral"}>
                  {it.active ? "啟用" : "停用"}
                </Badge>
              </Td>
              <Td className="text-right">
                <div className="flex justify-end gap-2">
                  <ButtonLink
                    href={`/admin/items/${it.id}`}
                    variant="secondary"
                    size="sm"
                  >
                    編輯
                  </ButtonLink>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => toggleActive(it.id)}
                  >
                    {it.active ? "停用" : "啟用"}
                  </Button>
                </div>
              </Td>
            </tr>
          ))}
          {pageRows.length === 0 && (
            <tr>
              <Td className="text-center text-muted" colSpan={8}>
                沒有符合的品項
              </Td>
            </tr>
          )}
        </tbody>
      </TableWrap>

      <Pagination
        page={current}
        pageCount={pageCount}
        total={rows.length}
        pageSize={pageSize}
        onPage={setPage}
      />

      <p className="text-xs text-muted">
        ＊刪除目前只作用在本頁預覽，重新整理會還原。
      </p>
    </div>
  );
}
