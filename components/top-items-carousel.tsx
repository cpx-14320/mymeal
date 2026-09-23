"use client";

import { useEffect, useState } from "react";
import { Modal, ModalHeader } from "@/components/ui/modal";
import type { CatalogItemView } from "@/lib/models/catalog-item";
import type { ItemStat } from "@/lib/models/item-review";

const ITEMS_PER_SLIDE = 4;
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

  const ranked = [...items]
    .map((item) => ({ item, stat: stats[item.id] ?? EMPTY_STAT }))
    .sort(
      (a, b) =>
        b.stat.commentCount - a.stat.commentCount || (b.stat.avgRating ?? 0) - (a.stat.avgRating ?? 0),
    );

  const topItems = ranked.slice(0, 12);
  const slides = Array.from(
    { length: Math.ceil(topItems.length / ITEMS_PER_SLIDE) },
    (_, i) => topItems.slice(i * ITEMS_PER_SLIDE, i * ITEMS_PER_SLIDE + ITEMS_PER_SLIDE),
  );

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 4000);
    return () => clearInterval(t);
  }, [slides.length]);

  if (slides.length === 0) return null;

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
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map((slide, si) => (
            <div key={si} className="grid w-full shrink-0 grid-cols-2 gap-3 p-4 sm:grid-cols-4">
              {slide.map(({ item, stat }) => (
                <div
                  key={item.id}
                  className="flex flex-col items-center gap-1.5 rounded-lg bg-brand-soft p-4 text-center"
                >
                  <span className="text-4xl">{item.emoji}</span>
                  <span className="text-sm font-medium">{item.name}</span>
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <span className="text-warning">
                      ★ {stat.avgRating !== null ? stat.avgRating.toFixed(1) : "—"}
                    </span>
                    <span>💬 {stat.commentCount}</span>
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
              className={`size-1.5 rounded-full ${si === index ? "bg-brand" : "bg-line"}`}
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
              <span className="text-2xl">{item.emoji}</span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{item.name}</span>
              <span className="shrink-0 text-sm tabular-nums text-muted">
                ★ {stat.avgRating !== null ? stat.avgRating.toFixed(1) : "—"}・💬 {stat.commentCount}
              </span>
            </li>
          ))}
        </ul>
      </Modal>
    </div>
  );
}
