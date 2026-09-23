"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Badge,
  Button,
  ButtonLink,
  TableWrap,
  Th,
  Td,
  Pagination,
  ListToolbar,
  BulkActionBar,
} from "@/components/ui/primitives";
import type { CatalogItemView } from "@/lib/models/catalog-item";
import type { ItemCategoryOption } from "@/lib/models/item-category";
import type { TagGroupView } from "@/lib/models/tag-group";
import { setItemsActiveAction, deleteItemsAction } from "@/app/(app)/admin/items/actions";

type Filter = "all" | string; // "all" 或 categoryId

/** 品項的標籤值裡，屬於某個標籤群組的那些——欄位跟著後台「分類與標籤」建立的群組走，新增群組就多一欄，品項有勾選對應選項才會顯示。 */
function tagValueForGroup(tags: string[], group: TagGroupView): string {
  const matched = tags.filter((t) => group.options.includes(t));
  return matched.length ? matched.join("、") : "—";
}

export function ItemsTable({
  items,
  categories,
  tagGroups,
}: {
  items: CatalogItemView[];
  categories: ItemCategoryOption[];
  tagGroups: TagGroupView[];
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [busy, setBusy] = useState(false);

  const tabs: { key: Filter; label: string }[] = [
    { key: "all", label: "全部" },
    ...categories.map((c) => ({ key: c.id, label: c.name })),
  ];

  const rows = items.filter((it) => filter === "all" || it.categoryId === filter);

  const countOf = (f: Filter) => (f === "all" ? items.length : items.filter((it) => it.categoryId === f).length);

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

  const pageAllSelected = pageRows.length > 0 && pageRows.every((r) => selected.has(r.id));

  const togglePageAll = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (pageAllSelected) pageRows.forEach((r) => next.delete(r.id));
      else pageRows.forEach((r) => next.add(r.id));
      return next;
    });

  async function bulkSetActive(active: boolean) {
    setBusy(true);
    await setItemsActiveAction([...selected], active);
    setSelected(new Set());
    setBusy(false);
    router.refresh();
  }

  async function toggleActive(it: CatalogItemView) {
    setBusy(true);
    await setItemsActiveAction([it.id], !it.active);
    setBusy(false);
    router.refresh();
  }

  async function bulkDelete() {
    setBusy(true);
    await deleteItemsAction([...selected]);
    setSelected(new Set());
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <ListToolbar
        tabs={{ tabs: tabs.map((t) => ({ ...t, count: countOf(t.key) })), value: filter, onChange: pick }}
        pageSize={pageSize}
        onPageSizeChange={(n) => {
          setPageSize(n);
          setPage(1);
        }}
      />

      <BulkActionBar
        count={selected.size}
        unit="項"
        onCancel={() => setSelected(new Set())}
        actions={[
          { label: "啟用選取", tone: "neutral", onClick: () => bulkSetActive(true), disabled: busy },
          { label: "停用選取", tone: "neutral", onClick: () => bulkSetActive(false), disabled: busy },
          { label: "刪除選取", tone: "danger", onClick: bulkDelete, disabled: busy },
        ]}
      />

      <TableWrap>
        <thead>
          <tr>
            <Th className="w-10">
              <input type="checkbox" checked={pageAllSelected} onChange={togglePageAll} aria-label="選取本頁全部" />
            </Th>
            <Th>品項</Th>
            <Th>頁面</Th>
            <Th>分類</Th>
            {tagGroups.map((g) => (
              <Th key={g.id}>{g.name}</Th>
            ))}
            <Th className="text-right">價錢</Th>
            <Th>狀態</Th>
            <Th>建立者</Th>
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
              <Td>
                <span className="mr-1.5">{it.emoji}</span>
                {it.name}
              </Td>
              <Td className="text-muted">{it.pageName ?? "—"}</Td>
              <Td className="text-muted">{it.categoryName}</Td>
              {tagGroups.map((g) => (
                <Td key={g.id} className="text-muted">
                  {tagValueForGroup(it.tags, g)}
                </Td>
              ))}
              <Td className="text-right tabular-nums">NT$ {it.price}</Td>
              <Td>
                <Badge tone={it.active ? "positive" : "neutral"}>{it.active ? "啟用" : "停用"}</Badge>
              </Td>
              <Td className="text-muted">{it.createdBy}</Td>
              <Td className="text-right">
                <div className="flex justify-end gap-2">
                  <ButtonLink href={`/admin/items/${it.id}`} variant="secondary" size="sm">
                    編輯
                  </ButtonLink>
                  <Button variant="secondary" size="sm" disabled={busy} onClick={() => toggleActive(it)}>
                    {it.active ? "停用" : "啟用"}
                  </Button>
                </div>
              </Td>
            </tr>
          ))}
          {pageRows.length === 0 && (
            <tr>
              <Td className="text-center text-muted" colSpan={8 + tagGroups.length}>
                目前沒有資料
              </Td>
            </tr>
          )}
        </tbody>
      </TableWrap>

      <Pagination page={current} pageCount={pageCount} total={rows.length} pageSize={pageSize} onPage={setPage} />
    </div>
  );
}
