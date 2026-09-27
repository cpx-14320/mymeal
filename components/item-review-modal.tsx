"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/primitives";
import { Modal, ModalHeader } from "@/components/ui/modal";
import { useLoginModal } from "@/components/layout/login-modal-context";
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
 * 共用的品項評論彈窗——品項卡片（ItemCard）的「評論(N)」按鈕、我的收藏頁「我的評論」
 * 分頁的「編輯」按鈕都用這個，兩處觸發的效果要一致，不要各自刻一份。
 * 由外部（open/onClose）控制開關，一開啟就重新向後端拿這個品項的評論列表。
 */
export function ItemReviewModal({
  itemId,
  itemName,
  open,
  onClose,
  onSubmitted,
}: {
  itemId: string;
  itemName: string;
  open: boolean;
  onClose: () => void;
  /** 送出評論成功後呼叫，帶回最新的品項統計（平均分數／評論數），給呼叫端更新自己的顯示用。 */
  onSubmitted?: (stat: ItemStat | undefined) => void;
}) {
  const { openLogin } = useLoginModal();
  const [loadingComments, setLoadingComments] = useState(false);
  const [comments, setComments] = useState<ItemReviewEntry[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [myReview, setMyReview] = useState<MyReview | null>(null);
  const [draftStars, setDraftStars] = useState(0);
  const [draftText, setDraftText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadingComments(true);
    setSubmitError(null);
    getItemReviewsAction(itemId).then(({ entries, myReview: mine, isLoggedIn: loggedIn }) => {
      if (cancelled) return;
      setComments(entries);
      setIsLoggedIn(loggedIn);
      setMyReview(mine);
      setDraftStars(mine?.stars ?? 0);
      setDraftText(mine?.text ?? "");
      setLoadingComments(false);
    });
    return () => {
      cancelled = true;
    };
  }, [open, itemId]);

  async function submitReview() {
    if (draftStars < 1) {
      setSubmitError("請先選擇星等");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    const result = await submitItemReviewAction(itemId, draftStars, draftText);
    setSubmitting(false);
    if (result.error) {
      setSubmitError(result.error);
      return;
    }
    setComments(result.entries ?? []);
    setMyReview({ stars: draftStars, text: draftText.trim() || undefined });
    onSubmitted?.(result.stat);
  }

  return (
    <Modal open={open} onClose={onClose} ariaLabel={`${itemName} 的評論`}>
      <ModalHeader title={`${itemName}．評論`} subtitle={`共 ${comments.length} 則評論`} onClose={onClose} />
      <div className="flex-1 overflow-y-auto p-4">
        {loadingComments ? (
          <p className="text-sm text-muted">載入中…</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted">尚未有任何評論。</p>
        ) : (
          <ul className="space-y-3">
            {comments.map((c, i) => (
              <li key={i} className="border-b border-line pb-3 last:border-0 last:pb-0">
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
              <p className="text-sm font-medium">{myReview ? "修改我的評論" : "留下評論"}</p>
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
              <Button type="button" size="sm" onClick={() => openLogin()}>
                登入
              </Button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
