"use client";

import { useState } from "react";
import { Card, Badge, Button } from "@/components/ui/primitives";
import { Modal, ModalHeader } from "@/components/ui/modal";
import { useLoginModal } from "@/components/layout/login-modal-context";
import type { CatalogItemView } from "@/lib/models/catalog-item";
import type { ItemStat, ItemReviewEntry, MyReview } from "@/lib/models/item-review";
import { getItemReviewsAction, submitItemReviewAction } from "@/app/(app)/catalog/actions";

function stars(n: number) {
  return "★".repeat(n) + "☆".repeat(5 - n);
}

function formatAt(at: Date) {
  return new Date(at).toLocaleDateString("zh-TW");
}

/** 1-5 星可點選的評分器，供下面的評論表單使用。 */
function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex gap-1 text-2xl text-warning">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`${n} 星`}
          onClick={() => onChange(n)}
          className="cursor-pointer leading-none"
        >
          {n <= value ? "★" : "☆"}
        </button>
      ))}
    </div>
  );
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
  const { openLogin } = useLoginModal();
  const [showComments, setShowComments] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [comments, setComments] = useState<ItemReviewEntry[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [myReview, setMyReview] = useState<MyReview | null>(null);
  const [draftStars, setDraftStars] = useState(0);
  const [draftText, setDraftText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [liveStat, setLiveStat] = useState(stat);

  async function openComments() {
    setShowComments(true);
    setLoadingComments(true);
    setSubmitError(null);
    const { entries, myReview: mine, isLoggedIn: loggedIn } = await getItemReviewsAction(item.id);
    setComments(entries);
    setIsLoggedIn(loggedIn);
    setMyReview(mine);
    setDraftStars(mine?.stars ?? 0);
    setDraftText(mine?.text ?? "");
    setLoadingComments(false);
  }

  async function submitReview() {
    if (draftStars < 1) {
      setSubmitError("請先選擇星等");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    const result = await submitItemReviewAction(item.id, draftStars, draftText);
    setSubmitting(false);
    if (result.error) {
      setSubmitError(result.error);
      return;
    }
    setComments(result.entries ?? []);
    setMyReview({ stars: draftStars, text: draftText.trim() || undefined });
    if (result.stat) setLiveStat(result.stat);
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
              onClick={openComments}
              className="cursor-pointer text-sm text-muted hover:text-ink"
            >
              評論({liveStat?.commentCount ?? 0})
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

        {!loadingComments && (
          <div className="space-y-2 border-t border-line p-4">
            {isLoggedIn ? (
              <>
                <p className="text-sm font-medium">
                  {myReview ? "修改我的評論" : "留下評論"}
                </p>
                <StarPicker value={draftStars} onChange={setDraftStars} />
                <textarea
                  value={draftText}
                  onChange={(e) => setDraftText(e.target.value)}
                  placeholder="想說點什麼嗎？（可留空，只給星等也可以）"
                  rows={2}
                  className="w-full rounded-lg border border-line bg-surface p-2 text-sm outline-none focus:border-brand"
                />
                <div className="flex items-center justify-between gap-2">
                  {submitError && <p className="text-xs text-danger">{submitError}</p>}
                  <Button
                    type="button"
                    size="sm"
                    className="ml-auto"
                    onClick={submitReview}
                    disabled={submitting}
                  >
                    {submitting ? "送出中…" : myReview ? "更新評論" : "送出評論"}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-muted">登入後才能留下評分與評論。</p>
                <Button type="button" size="sm" onClick={openLogin}>
                  登入
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
