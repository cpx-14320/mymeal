"use client";

import { useEffect, useState } from "react";
import { ItemThumbnail } from "@/components/ui/primitives";
import { Modal, ModalHeader } from "@/components/ui/modal";
import { ItemReviewModal } from "@/components/item-review-modal";
import type { CatalogItemView } from "@/lib/models/catalog-item";
import type { ItemStat } from "@/lib/models/item-review";

const EMPTY_STAT: ItemStat = { avgRating: null, commentCount: 0 };

/**
 * 熱門品項輪播——依真實評論數排序（沒有真的訂單數量可用，用評論熱度當「熱門」指標）。
 * 吃 items/stats 當 props，所以「所有品項」頁跟頁面詳情頁都能各自算自己範圍內的排行，不是站內固定一份。
 */
export function TopItemsCarousel({
  items,
  stats,
  title = "熱門品項",
}: {
  items: CatalogItemView[];
  stats: Record<string, ItemStat>;
  title?: string;
}) {
  const [index, setIndex] = useState(0);
  const [showAll, setShowAll] = useState(false);
  // 手機版一列只顯示 2 欄、桌面版 4 欄——每組（slide）要剛好塞滿一列，
  // 不然手機版會變成 2 欄 x 2 列，「下一組」按鈕還沒按就已經看到第二列的品項了。
  const [itemsPerSlide, setItemsPerSlide] = useState(4);
  // 點「N 則評論」開的是共用的 ItemReviewModal（跟品項卡片、我的收藏頁同一個彈窗），
  // liveStats 記錄送出評論後回傳的最新統計，讓這裡的排行/計數不用整頁重新整理就能同步。
  const [reviewItem, setReviewItem] = useState<{ id: string; name: string } | null>(null);
  const [liveStats, setLiveStats] = useState<Record<string, ItemStat>>({});

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const update = () => setItemsPerSlide(mq.matches ? 4 : 2);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const statFor = (item: CatalogItemView) => liveStats[item.id] ?? stats[item.id] ?? EMPTY_STAT;

  const ranked = [...items]
    .map((item) => ({ item, stat: statFor(item) }))
    .sort(
      (a, b) =>
        b.stat.commentCount - a.stat.commentCount || (b.stat.avgRating ?? 0) - (a.stat.avgRating ?? 0),
    );

  const topItems = ranked.slice(0, 12);
  const slides = Array.from(
    { length: Math.ceil(topItems.length / itemsPerSlide) },
    (_, i) => topItems.slice(i * itemsPerSlide, i * itemsPerSlide + itemsPerSlide),
  );

  if (slides.length === 0) return null;

  // itemsPerSlide 隨螢幕寬度變動時 slides 數量也會跟著變，index 可能超出新的範圍。
  const current = Math.min(index, slides.length - 1);

  return (
    <div className="relative overflow-hidden rounded-xl border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <p className="text-sm font-medium">{title}</p>
        <button type="button" onClick={() => setShowAll(true)} className="text-xs text-muted hover:text-brand">
          查看更多
        </button>
      </div>

      <div className="relative">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {slides.map((slide, si) => (
            <div key={si} className="grid w-full shrink-0 grid-cols-2 gap-3 p-4 sm:grid-cols-4">
              {slide.map(({ item, stat }) => (
                <div
                  key={item.id}
                  className="flex items-center justify-center gap-3 rounded-lg bg-brand-soft p-3 sm:justify-start"
                >
                  <ItemThumbnail
                    imageUrl={item.imageUrl}
                    emoji={item.emoji}
                    alt=""
                    size={64}
                    className="size-16 shrink-0 rounded-lg object-cover"
                    emojiClassName="text-4xl"
                  />
                  <div className="min-w-0 sm:flex-1">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    <div className="mt-1 flex flex-col items-start gap-0.5 text-xs text-muted sm:flex-row sm:items-center sm:gap-2">
                      <span className="text-warning">
                        ★ {stat.avgRating !== null ? stat.avgRating.toFixed(1) : "—"}
                      </span>
                      <button
                        type="button"
                        onClick={() => setReviewItem({ id: item.id, name: item.name })}
                        className="cursor-pointer hover:text-ink hover:underline"
                      >
                        {stat.commentCount} 則評論
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {slides.length > 1 && (
          <>
            <button
              type="button"
              aria-label="上一組"
              onClick={() => setIndex((i) => (i - 1 + slides.length) % slides.length)}
              className="absolute left-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-surface/90 text-ink shadow hover:bg-surface"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="下一組"
              onClick={() => setIndex((i) => (i + 1) % slides.length)}
              className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-surface/90 text-ink shadow hover:bg-surface"
            >
              ›
            </button>
          </>
        )}
      </div>

      {slides.length > 1 && (
        <div className="flex justify-center gap-1.5 pb-3">
          {slides.map((_, si) => (
            <button
              key={si}
              type="button"
              aria-label={`第 ${si + 1} 組`}
              onClick={() => setIndex(si)}
              className={`size-1.5 rounded-full ${si === current ? "bg-brand" : "bg-line"}`}
            />
          ))}
        </div>
      )}

      <Modal open={showAll} onClose={() => setShowAll(false)} ariaLabel={`${title}清單`}>
        <ModalHeader title={`${title}．依評論熱度排序`} onClose={() => setShowAll(false)} />
        <ul className="min-h-[200px] flex-1 divide-y divide-line overflow-y-auto">
          {ranked.length === 0 && (
            <li className="grid h-[200px] place-items-center px-4 text-center text-sm text-muted">
              目前沒有品項。
            </li>
          )}
          {ranked.map(({ item, stat }, i) => (
            <li key={item.id} className="flex items-center gap-3 px-4 py-2.5">
              <span className="w-5 shrink-0 text-right text-xs tabular-nums text-muted">{i + 1}</span>
              <ItemThumbnail
                imageUrl={item.imageUrl}
                emoji={item.emoji}
                alt=""
                size={40}
                className="size-10 shrink-0 rounded object-cover"
                emojiClassName="text-2xl"
              />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{item.name}</span>
              <span className="shrink-0 text-sm tabular-nums text-muted">
                ★ {stat.avgRating !== null ? stat.avgRating.toFixed(1) : "—"}・
                <button
                  type="button"
                  onClick={() => setReviewItem({ id: item.id, name: item.name })}
                  className="cursor-pointer hover:text-ink hover:underline"
                >
                  {stat.commentCount} 則評論
                </button>
              </span>
            </li>
          ))}
        </ul>
      </Modal>

      <ItemReviewModal
        itemId={reviewItem?.id ?? ""}
        itemName={reviewItem?.name ?? ""}
        open={reviewItem !== null}
        onClose={() => setReviewItem(null)}
        onSubmitted={(nextStat) => {
          if (nextStat && reviewItem) setLiveStats((prev) => ({ ...prev, [reviewItem.id]: nextStat }));
        }}
      />
    </div>
  );
}
