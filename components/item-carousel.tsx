"use client";

import { useEffect, useState } from "react";
import { PillTabs } from "@/components/ui/primitives";
import { Modal, ModalHeader } from "@/components/ui/modal";
import { itemStatsList, itemById, tagGroups } from "@/lib/mock";

const ITEMS_PER_SLIDE = 4;

const topItems = itemStatsList()
  .slice(0, 12)
  .map((s) => {
    const item = itemById(s.itemId);
    return item ? { item, stat: s } : null;
  })
  .filter((v): v is NonNullable<typeof v> => Boolean(v));

const slides = Array.from(
  { length: Math.ceil(topItems.length / ITEMS_PER_SLIDE) },
  (_, i) => topItems.slice(i * ITEMS_PER_SLIDE, i * ITEMS_PER_SLIDE + ITEMS_PER_SLIDE),
);

const allItemsByOrders = itemStatsList()
  .map((s) => {
    const item = itemById(s.itemId);
    return item ? { item, stat: s } : null;
  })
  .filter((v): v is NonNullable<typeof v> => Boolean(v));

type RankFilter = "all" | string;

const stapleOptions = tagGroups.find((g) => g.id === "staple")?.options ?? [];
const meatOptions = tagGroups.find((g) => g.id === "meat")?.options ?? [];
const rankTags = [
  ...stapleOptions.filter((o) => o !== "無"),
  ...meatOptions,
];

const rankTabs: { key: RankFilter; label: string }[] = [
  { key: "all", label: "全部" },
  ...rankTags.map((t) => ({ key: t, label: t })),
];

/** 熱門品項輪播：目前依訂購數量排序取前幾名，圖片先用品項的備用 emoji。 */
export function ItemCarousel() {
  const [index, setIndex] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [rankFilter, setRankFilter] = useState<RankFilter>("all");

  const rankCountOf = (f: RankFilter) =>
    f === "all"
      ? allItemsByOrders.length
      : allItemsByOrders.filter(({ item }) => item.tags.includes(f)).length;

  const filteredRanking =
    rankFilter === "all"
      ? allItemsByOrders
      : allItemsByOrders.filter(({ item }) => item.tags.includes(rankFilter));

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 4000);
    return () => clearInterval(t);
  }, []);

  if (slides.length === 0) return null;

  return (
    <div className="relative overflow-hidden rounded-xl border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <p className="text-sm font-medium">熱門品項</p>
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="text-xs text-muted hover:text-brand"
        >
          查看更多
        </button>
      </div>

      <div className="relative">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map((slide, si) => (
            <div
              key={si}
              className="grid w-full shrink-0 grid-cols-2 gap-3 p-4 sm:grid-cols-4"
            >
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
              onClick={() =>
                setIndex((i) => (i - 1 + slides.length) % slides.length)
              }
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
              className={`size-1.5 rounded-full ${
                si === index ? "bg-brand" : "bg-line"
              }`}
            />
          ))}
        </div>
      )}

      <Modal
        open={showAll}
        onClose={() => setShowAll(false)}
        ariaLabel="熱門品項清單"
      >
        <ModalHeader
          title="熱門品項．依訂購數量排序"
          onClose={() => setShowAll(false)}
        />
        <div className="border-b border-line px-4 py-3">
          <PillTabs
            tabs={rankTabs.map((t) => ({ ...t, count: rankCountOf(t.key) }))}
            value={rankFilter}
            onChange={setRankFilter}
          />
        </div>
        <ul className="min-h-[200px] flex-1 divide-y divide-line overflow-y-auto">
          {filteredRanking.length === 0 && (
            <li className="grid h-[200px] place-items-center px-4 text-center text-sm text-muted">
              這個分類目前沒有品項。
            </li>
          )}
          {filteredRanking.map(({ item, stat }, i) => (
            <li key={item.id} className="flex items-center gap-3 px-4 py-2.5">
              <span className="w-5 shrink-0 text-right text-xs tabular-nums text-muted">
                {i + 1}
              </span>
              <span className="text-2xl">{item.emoji}</span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {item.name}
              </span>
              <span className="shrink-0 text-sm tabular-nums text-muted">
                訂購 {stat.totalQuantity}
              </span>
            </li>
          ))}
        </ul>
      </Modal>
    </div>
  );
}
