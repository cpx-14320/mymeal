"use client";

import { useState } from "react";
import {
  Badge,
  Button,
  TableWrap,
  Th,
  Td,
  Pagination,
  PageSizeSelect,
} from "@/components/ui/primitives";
import { suppliers } from "@/lib/mock";

export function SuppliersTable() {
  const [items, setItems] = useState(() => suppliers);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * pageSize;
  const rows = items.slice(start, start + pageSize);

  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const pageAllSelected =
    rows.length > 0 && rows.every((s) => selected.has(s.id));

  const togglePageAll = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (pageAllSelected) rows.forEach((s) => next.delete(s.id));
      else rows.forEach((s) => next.add(s.id));
      return next;
    });

  const bulkSetActive = (active: boolean) => {
    setItems((prev) =>
      prev.map((s) => (selected.has(s.id) ? { ...s, active } : s)),
    );
    setSelected(new Set());
  };

  const bulkDelete = () => {
    setItems((prev) => prev.filter((s) => !selected.has(s.id)));
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
            已選 <b className="tabular-nums">{selected.size}</b> 家
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
            <Th>名稱</Th>
            <Th>類型</Th>
            <Th>電話</Th>
            <Th>狀態</Th>
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
              <Td>
                <Badge>{s.type}</Badge>
              </Td>
              <Td className="tabular-nums text-muted">{s.phone}</Td>
              <Td>
                <Badge tone={s.active ? "positive" : "neutral"}>
                  {s.active ? "啟用" : "停用"}
                </Badge>
              </Td>
              <Td className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" size="sm">
                    編輯
                  </Button>
                  <Button variant="secondary" size="sm">
                    {s.active ? "停用" : "啟用"}
                  </Button>
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </TableWrap>

      <Pagination
        page={current}
        pageCount={pageCount}
        total={items.length}
        pageSize={pageSize}
        onPage={setPage}
        unit="家"
      />

      <p className="text-xs text-muted">＊此頁為介面預覽，資料為範例。</p>
    </div>
  );
}
