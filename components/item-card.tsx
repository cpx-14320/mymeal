"use client";

import { useState } from "react";
import { Card, Badge, ItemThumbnailFill } from "@/components/ui/primitives";
import { ItemReviewModal } from "@/components/item-review-modal";
import type { CatalogItemView } from "@/lib/models/catalog-item";
import type { ItemStat } from "@/lib/models/item-review";

/**
 * 共用的品項卡片——所有品項頁、我的收藏頁、本週餐點都用這張卡片，
 * 樣式以「所有品項」為主：emoji、分類徽章、評分＋價格＋評論數，
 * 評論用共用的 ItemReviewModal 顯示（我的收藏頁「我的評論」分頁的編輯按鈕也是同一個彈窗）。
 */
export function ItemCard({
  item,
  stat,
  isFavorited,
  onToggleFavorite,
  favoritePending,
}: {
  item: CatalogItemView;
  stat?: ItemStat;
  isFavorited: boolean;
  onToggleFavorite: () => void;
  favoritePending?: boolean;
}) {
  const [showComments, setShowComments] = useState(false);
  const [liveStat, setLiveStat] = useState(stat);

  return (
    <>
      <Card className="overflow-hidden">
        <ItemThumbnailFill
          imageUrl={item.imageUrl}
          emoji={item.emoji}
          alt={item.name}
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          containerClassName="relative grid aspect-[3/2] place-items-center overflow-hidden bg-brand-soft text-4xl"
        />
        <div className="space-y-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium">{item.name}</p>
            </div>
            <button
              type="button"
              aria-label={isFavorited ? "取消收藏" : "收藏"}
              onClick={onToggleFavorite}
              disabled={favoritePending}
              className={`cursor-pointer disabled:opacity-50 ${isFavorited ? "text-brand" : "text-muted hover:text-brand"}`}
            >
              {isFavorited ? "♥" : "♡"}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {item.tags.map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
            {liveStat?.avgRating != null && (
              <Badge tone="warning">★ {liveStat.avgRating.toFixed(1)}</Badge>
            )}
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-sm font-semibold text-brand">
              NT$ {item.price}
            </span>
            <button
              type="button"
              onClick={() => setShowComments(true)}
              className="cursor-pointer text-sm text-muted hover:text-ink"
            >
              評論({liveStat?.commentCount ?? 0})
            </button>
          </div>
        </div>
      </Card>

      <ItemReviewModal
        itemId={item.id}
        itemName={item.name}
        open={showComments}
        onClose={() => setShowComments(false)}
        onSubmitted={(nextStat) => {
          if (nextStat) setLiveStat(nextStat);
        }}
      />
    </>
  );
}
