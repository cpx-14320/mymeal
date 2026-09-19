"use client";

import { useState } from "react";
import { Card, Badge } from "@/components/ui/primitives";
import { Modal, ModalHeader } from "@/components/ui/modal";
import type { CatalogItemView } from "@/lib/models/catalog-item";
import type { ItemStat, ItemReviewEntry } from "@/lib/models/item-review";
import { getItemReviewsAction } from "@/app/(app)/catalog/actions";

function stars(n: number) {
  return "★".repeat(n) + "☆".repeat(5 - n);
}

function formatAt(at: Date) {
  return new Date(at).toLocaleDateString("zh-TW");
}

/**
 * 共用的品項卡片——所有品項頁、我的收藏頁、本週餐點都用這張卡片，
 * 樣式以「所有品項」為主：emoji、分類徽章、評分＋價格＋評論數，
 * 評論用彈窗顯示，開啟時才向後端拿這個品項的評論列表。
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
  const [loadingComments, setLoadingComments] = useState(false);
  const [comments, setComments] = useState<ItemReviewEntry[]>([]);

  async function openComments() {
    setShowComments(true);
    setLoadingComments(true);
    const rows = await getItemReviewsAction(item.id);
    setComments(rows);
    setLoadingComments(false);
  }

  return (
    <>
      <Card className="overflow-hidden">
        <div className="grid h-28 place-items-center bg-brand-soft text-4xl">
          {item.emoji}
        </div>
        <div className="space-y-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-xs text-muted">
                {item.supplierName ?? item.categoryName}
              </p>
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
            <Badge tone="brand">{item.categoryName}</Badge>
            {stat?.avgRating != null && (
              <Badge tone="warning">★ {stat.avgRating.toFixed(1)}</Badge>
            )}
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-sm font-semibold text-brand">
              NT$ {item.price}
            </span>
            <button
              type="button"
              onClick={openComments}
              className="cursor-pointer text-sm text-muted hover:text-ink"
            >
              評論({stat?.commentCount ?? 0})
            </button>
          </div>
        </div>
      </Card>

      <Modal
        open={showComments}
        onClose={() => setShowComments(false)}
        ariaLabel={`${item.name} 的評論`}
      >
        <ModalHeader
          title={`${item.name}．評論`}
          subtitle={`共 ${comments.length} 則評論`}
          onClose={() => setShowComments(false)}
        />
        <div className="flex-1 overflow-y-auto p-4">
          {loadingComments ? (
            <p className="text-sm text-muted">載入中…</p>
          ) : comments.length === 0 ? (
            <p className="text-sm text-muted">尚未有任何評論。</p>
          ) : (
            <ul className="space-y-3">
              {comments.map((c, i) => (
                <li
                  key={i}
                  className="border-b border-line pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{c.memberName}</p>
                    <p className="text-xs text-muted">{formatAt(c.at)}</p>
                  </div>
                  <p className="text-warning">{stars(c.stars)}</p>
                  <p className="mt-1 text-sm text-muted">{c.text}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Modal>
    </>
  );
}
