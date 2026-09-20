"use client";

import { useState } from "react";
import { ItemCard } from "@/components/item-card";
import { useLoginModal } from "@/components/layout/login-modal-context";
import { toggleFavoriteAction } from "@/app/(app)/favorite-actions";
import type { CatalogItemView } from "@/lib/models/catalog-item";
import type { ItemStat } from "@/lib/models/item-review";

/**
 * 頁面套用模板時用——依模板的 section 分組顯示（例如星期一～星期五），
 * 跟 ItemGrid（平舖＋分類篩選＋分頁）是兩種不同畫法，不共用同一個元件。
 */
export function TemplateMenuSections({
  sections,
  stats,
  initialFavoriteIds = [],
}: {
  sections: { id: string; name: string; items: CatalogItemView[] }[];
  stats: Record<string, ItemStat>;
  initialFavoriteIds?: string[];
}) {
  const { openLogin } = useLoginModal();
  const [favorited, setFavorited] = useState<Set<string>>(() => new Set(initialFavoriteIds));
  const [pendingIds, setPendingIds] = useState<Set<string>>(() => new Set());

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

  const hasAnyItem = sections.some((sec) => sec.items.length > 0);
  if (!hasAnyItem) {
    return <p className="py-10 text-center text-sm text-muted">這個模板還沒有任何品項。</p>;
  }

  return (
    <div className="space-y-8">
      {sections.map(
        (sec) =>
          sec.items.length > 0 && (
            <section key={sec.id} className="space-y-3">
              <h2 className="text-lg font-bold tracking-tight">{sec.name}</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {sec.items.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    stat={stats[item.id]}
                    isFavorited={favorited.has(item.id)}
                    onToggleFavorite={() => toggleFavorite(item.id)}
                    favoritePending={pendingIds.has(item.id)}
                  />
                ))}
              </div>
            </section>
          ),
      )}
    </div>
  );
}
