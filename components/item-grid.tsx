"use client";

import { useEffect, useState } from "react";
import { PillTabs, PageSizeSelect, Pagination } from "@/components/ui/primitives";
import { ItemCard } from "@/components/item-card";
import type { CatalogItemView } from "@/lib/models/catalog-item";
import type { ItemCategoryOption } from "@/lib/models/item-category";
import type { ItemStat } from "@/lib/models/item-review";

type Filter = "all" | string; // "all" 或分類名稱

/**
 * 品項卡片列表——所有品項頁跟我的收藏頁共用同一個元件，以所有品項的樣式為主。
 * scope="all"：瀏覽全部品項（真資料庫），收藏只是視覺切換，還沒真的存進 favorites。
 * scope="favorites"：只顯示 initialFavoriteIds 裡的品項；目前恆為空（收藏還沒接真資料），
 * 取消收藏會直接從清單移除，重新整理後仍會是空的。
 */
export function ItemGrid({
  scope = "all",
  initialFavoriteIds = [],
  items,
  stats,
  categories,
}: {
  scope?: "all" | "favorites";
  initialFavoriteIds?: string[];
  items: CatalogItemView[];
  stats: Record<string, ItemStat>;
  categories: ItemCategoryOption[];
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [favorited, setFavorited] = useState<Set<string>>(
    () => new Set(scope === "favorites" ? initialFavoriteIds : []),
  );

  const baseItems =
    scope === "favorites"
      ? items.filter((it) => initialFavoriteIds.includes(it.id))
      : items;

  const scopedItems =
    scope === "favorites"
      ? baseItems.filter((it) => favorited.has(it.id))
      : baseItems;

  // 分類頁籤只顯示目前這批品項實際用到的分類——例如某店家只有飲料，
  // 便當之類的分類就不會冒出一個永遠是 0 筆的死頁籤。排序沿用全站分類的 sortOrder。
  const presentCategoryNames = new Set(scopedItems.map((it) => it.categoryName));
  const tabs: { key: Filter; label: string }[] = [
    { key: "all", label: "全部" },
    ...categories
      .filter((c) => presentCategoryNames.has(c.name))
      .map((c) => ({ key: c.name, label: c.name })),
  ];

  useEffect(() => {
    if (filter !== "all" && !presentCategoryNames.has(filter)) setFilter("all");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, scopedItems.length]);

  const rows = scopedItems.filter(
    (it) => filter === "all" || it.categoryName === filter,
  );
  const countOf = (f: Filter) =>
    f === "all"
      ? scopedItems.length
      : scopedItems.filter((it) => it.categoryName === f).length;

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * pageSize;
  const pageRows = rows.slice(start, start + pageSize);

  const toggleFavorite = (id: string) =>
    setFavorited((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PillTabs
          tabs={tabs.map((t) => ({ ...t, count: countOf(t.key) }))}
          value={filter}
          onChange={(f) => {
            setFilter(f);
            setPage(1);
          }}
        />
        <PageSizeSelect
          value={pageSize}
          onChange={(n) => {
            setPageSize(n);
            setPage(1);
          }}
        />
      </div>

      {rows.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted">
          {scope === "favorites" ? "還沒有收藏的品項。" : "沒有符合的品項。"}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {pageRows.map((it) => (
            <ItemCard
              key={it.id}
              item={it}
              stat={stats[it.id]}
              isFavorited={favorited.has(it.id)}
              onToggleFavorite={() => toggleFavorite(it.id)}
            />
          ))}
        </div>
      )}

      <Pagination
        page={current}
        pageCount={pageCount}
        total={rows.length}
        pageSize={pageSize}
        onPage={setPage}
        unit="項"
      />
    </>
  );
}
