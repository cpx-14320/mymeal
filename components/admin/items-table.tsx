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
  inputClass,
  paginate,
  DEFAULT_PAGE_SIZE,
  ItemLabel,
} from "@/components/ui/primitives";
import type { CatalogItemView } from "@/lib/models/catalog-item";
import type { ItemCategoryOption } from "@/lib/models/item-category";
import type { TagGroupView } from "@/lib/models/tag-group";
import type { PageView } from "@/lib/models/page";
import {
  setItemsActiveAction,
  setItemsPageAction,
  patchItemAction,
  deleteItemsAction,
} from "@/app/(app)/admin/items/actions";

type Filter = "all" | string; // "all" 或 categoryId

/** 表格內 inline 編輯用的下拉／輸入框樣式，跟 /admin/tasks（gamification-manager.tsx）的 cellInput 一致。 */
const cellSelect =
  "w-full rounded-md border border-transparent bg-transparent px-1 py-0.5 hover:border-line focus:border-brand focus:outline-none";

const UNSET_PAGE = "__unset__";

/** 品項的標籤裡，屬於某個標籤群組的那一個——inline 編輯只給每組「單一目前值」的快速下拉，
 *  多選群組要同時掛多個標籤時，還是要到完整編輯頁（item-form.tsx 的 checkbox 群組）。
 *  CSV 匯出/匯入（items-csv-buttons.tsx）也共用這支，讓每個標籤群組各自一欄。 */
export function tagGroupValue(tags: string[], group: TagGroupView): string {
  return tags.find((t) => group.options.includes(t)) ?? "";
}

/** 換掉 tags 陣列裡屬於這個群組的值，其他群組的標籤原樣保留。value 傳空字串代表清空這組。 */
function withTagGroupValue(tags: string[], group: TagGroupView, value: string): string[] {
  const rest = tags.filter((t) => !group.options.includes(t));
  return value ? [...rest, value] : rest;
}

export function ItemsTable({
  items,
  categories,
  tagGroups,
  pages,
}: {
  items: CatalogItemView[];
  categories: ItemCategoryOption[];
  tagGroups: TagGroupView[];
  pages: PageView[];
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [busy, setBusy] = useState(false);

  const tabs: { key: Filter; label: string }[] = [
    { key: "all", label: "全部" },
    ...categories.map((c) => ({ key: c.id, label: c.name })),
  ];

  const rows = items.filter(
    (it) => (filter === "all" || it.categoryId === filter) && (!search.trim() || it.name.includes(search)),
  );

  const countOf = (f: Filter) => (f === "all" ? items.length : items.filter((it) => it.categoryId === f).length);

  const { pageRows, pageCount, current, effectiveSize: effectivePageSize } = paginate(rows, page, pageSize);

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

  async function bulkSetPage(value: string) {
    if (!value) return; // 選到「設定頁面…」提示選項，不動作
    setBusy(true);
    await setItemsPageAction([...selected], value === UNSET_PAGE ? "" : value);
    setSelected(new Set());
    setBusy(false);
    router.refresh();
  }

  async function setItemPage(id: string, pageId: string) {
    setBusy(true);
    await setItemsPageAction([id], pageId);
    setBusy(false);
    router.refresh();
  }

  async function setItemCategory(id: string, categoryId: string) {
    setBusy(true);
    await patchItemAction(id, { categoryId });
    setBusy(false);
    router.refresh();
  }

  async function setItemTagGroup(it: CatalogItemView, group: TagGroupView, value: string) {
    setBusy(true);
    await patchItemAction(it.id, { tags: withTagGroupValue(it.tags, group, value) });
    setBusy(false);
    router.refresh();
  }

  async function setItemPrice(id: string, price: number) {
    setBusy(true);
    await patchItemAction(id, { price });
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

      <input
        className={`${inputClass} w-64`}
        placeholder="搜尋品項名稱"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
      />

      <BulkActionBar
        count={selected.size}
        unit="項"
        onCancel={() => setSelected(new Set())}
        extra={
          <select
            className="rounded-lg border border-line bg-surface px-2 py-1 text-[13px]"
            defaultValue=""
            disabled={busy}
            onChange={(e) => {
              bulkSetPage(e.target.value);
              e.target.value = "";
            }}
          >
            <option value="" disabled>
              設定頁面…
            </option>
            <option value={UNSET_PAGE}>（取消掛頁面）</option>
            {pages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        }
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
            <Th>價錢</Th>
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
                <ItemLabel imageUrl={it.imageUrl} emoji={it.emoji} name={it.name} />
              </Td>
              <Td className="text-muted">
                <select
                  key={it.pageId ?? ""}
                  className={cellSelect}
                  defaultValue={it.pageId ?? ""}
                  disabled={busy}
                  onChange={(e) => setItemPage(it.id, e.target.value)}
                >
                  <option value="">—</option>
                  {pages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </Td>
              <Td className="text-muted">
                <select
                  key={it.categoryId}
                  className={cellSelect}
                  defaultValue={it.categoryId}
                  disabled={busy}
                  onChange={(e) => setItemCategory(it.id, e.target.value)}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Td>
              {tagGroups.map((g) => {
                const value = tagGroupValue(it.tags, g);
                return (
                  <Td key={g.id} className="text-muted">
                    <select
                      key={value}
                      className={cellSelect}
                      defaultValue={value}
                      disabled={busy}
                      onChange={(e) => setItemTagGroup(it, g, e.target.value)}
                    >
                      <option value="">—</option>
                      {g.options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </Td>
                );
              })}
              <Td>
                <input
                  className="w-14 rounded-md border border-transparent bg-transparent px-1 py-0.5 text-left hover:border-line focus:border-brand focus:outline-none"
                  type="number"
                  min={0}
                  max={999}
                  step={5}
                  defaultValue={it.price}
                  disabled={busy}
                  onBlur={(e) => {
                    const n = Number(e.target.value);
                    if (Number.isFinite(n) && n !== it.price) setItemPrice(it.id, n);
                  }}
                />
              </Td>
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

      <Pagination page={current} pageCount={pageCount} total={rows.length} pageSize={effectivePageSize} onPage={setPage} />
    </div>
  );
}
