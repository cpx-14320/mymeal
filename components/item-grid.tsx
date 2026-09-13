"use client";

import { useState } from "react";
import { PillTabs, PageSizeSelect, Pagination } from "@/components/ui/primitives";
import { ItemCard } from "@/components/item-card";
import {
  catalogItems,
  type ItemKind,
  type CatalogItem,
} from "@/lib/mock";

type Filter = "all" | ItemKind;

const tabs: { key: Filter; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "meal", label: "餐點" },
  { key: "drink", label: "飲料" },
  { key: "snack", label: "點心" },
];

/**
 * 品項卡片列表——所有品項頁跟我的收藏頁共用同一個元件，以所有品項的樣式為主。
 * scope="all"：瀏覽全部品項，收藏只是視覺切換，不影響清單。
 * scope="favorites"：只顯示 initialFavoriteIds 裡的品項，取消收藏會直接從清單移除。
 */
export function ItemGrid({
  scope = "all",
  initialFavoriteIds = [],
}: {
  scope?: "all" | "favorites";
  initialFavoriteIds?: string[];
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [favorited, setFavorited] = useState<Set<string>>(
    () => new Set(scope === "favorites" ? initialFavoriteIds : []),
  );

  const baseItems =
    scope === "favorites"
      ? initialFavoriteIds
          .map((id) => catalogItems.find((it) => it.id === id))
          .filter((it): it is CatalogItem => Boolean(it))
      : catalogItems;

  const scopedItems =
    scope === "favorites"
      ? baseItems.filter((it) => favorited.has(it.id))
      : baseItems;

  const rows = scopedItems.filter(
    (it) => filter === "all" || it.kind === filter,
  );
  const countOf = (f: Filter) =>
    f === "all"
      ? scopedItems.length
      : scopedItems.filter((it) => it.kind === f).length;

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
