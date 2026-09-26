"use client";

import { useEffect, useState } from "react";
import { PillTabs, PageSizeSelect, Pagination, paginate } from "@/components/ui/primitives";
import { ItemCard } from "@/components/item-card";
import { useLoginModal } from "@/components/layout/login-modal-context";
import { toggleFavoriteAction } from "@/app/(app)/favorite-actions";
import type { CatalogItemView } from "@/lib/models/catalog-item";
import type { ItemCategoryOption } from "@/lib/models/item-category";
import type { ItemStat } from "@/lib/models/item-review";

type Filter = "all" | string; // "all" 或分類名稱

/**
 * 品項卡片列表——所有品項頁跟我的收藏頁共用同一個元件，以所有品項的樣式為主。
 * scope="all"：瀏覽全部品項（真資料庫）。scope="favorites"：只顯示收藏的品項，取消收藏會直接從清單移除。
 * 收藏切換是真的打 toggleFavoriteAction，未登入點愛心會跳出登入彈窗。
 */
export function ItemGrid({
  scope = "all",
  initialFavoriteIds = [],
  items,
  stats,
  categories,
  defaultPageSize = 12,
}: {
  scope?: "all" | "favorites";
  initialFavoriteIds?: string[];
  items: CatalogItemView[];
  stats: Record<string, ItemStat>;
  categories: ItemCategoryOption[];
  defaultPageSize?: number;
}) {
  const { openLogin } = useLoginModal();
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [favorited, setFavorited] = useState<Set<string>>(() => new Set(initialFavoriteIds));
  const [pendingIds, setPendingIds] = useState<Set<string>>(() => new Set());

  const baseItems =
    scope === "favorites"
      ? items.filter((it) => initialFavoriteIds.includes(it.id))
      : items;

  const scopedItems =
    scope === "favorites"
      ? baseItems.filter((it) => favorited.has(it.id))
      : baseItems;

  // 分類頁籤只顯示目前這批品項實際用到的分類——例如某頁面只有飲料，
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

  const { pageRows, pageCount, current, effectiveSize } = paginate(rows, page, pageSize);

  async function toggleFavorite(id: string) {
    if (pendingIds.has(id)) return;
    setPendingIds((prev) => new Set(prev).add(id));
    const result = await toggleFavoriteAction(id);
    setPendingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    if (result.error) {
      openLogin();
      return;
    }
    setFavorited((prev) => {
      const next = new Set(prev);
      if (result.favorited) next.add(id);
      else next.delete(id);
      return next;
    });
  }

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
              favoritePending={pendingIds.has(it.id)}
            />
          ))}
        </div>
      )}

      <Pagination
        page={current}
        pageCount={pageCount}
        total={rows.length}
        pageSize={effectiveSize}
        onPage={setPage}
        unit="項"
      />
    </>
  );
}
