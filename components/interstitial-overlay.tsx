"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { activeInterstitial, type Interstitial } from "@/lib/mock";

const shownOnPrefixes = ["/group-orders", "/menu"];

/**
 * 前台蓋台廣告：進站時全螢幕蓋住畫面，倒數後自動消失。
 * 只在「開團訂餐」與「本週餐點」顯示，避免切到其他頁面時一直被打斷。設定來自後台「蓋台廣告」。
 * 目前為介面預覽：資料取自 lib/mock，之後接資料庫。
 */
export function InterstitialOverlay() {
  const pathname = usePathname();
  const onFront = shownOnPrefixes.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  const [ad, setAd] = useState<Interstitial | null>(null);
  const [left, setLeft] = useState(0);
  const [open, setOpen] = useState(false);

  // 決定要不要顯示（掛載後才判斷時間，避免 SSR 不一致）
  useEffect(() => {
    if (!onFront) return;
    const a = activeInterstitial();
    if (!a) return;

    try {
      const today = new Date().toISOString().slice(0, 10);
      const key =
        a.frequency === "once"
          ? `mymeal-ad-${a.id}`
          : a.frequency === "daily"
            ? `mymeal-ad-${a.id}-${today}`
            : null;
      if (key) {
        if (localStorage.getItem(key)) return;
        localStorage.setItem(key, "1");
      }
    } catch {
      /* 私密視窗等情況忽略 */
    }

    setAd(a);
    setLeft(a.dismissSeconds);
    setOpen(true);
  }, [onFront]);

  // 鎖背景捲動 + Esc 關閉
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // 倒數
  useEffect(() => {
    if (!open || !ad || ad.dismissSeconds <= 0) return;
    if (left <= 0) {
      setOpen(false);
      return;
    }
    const t = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [open, left, ad]);

  if (!open || !ad) return null;

  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="廣告"
    >
      <div
        className="absolute inset-0 bg-black/60"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-[600px] overflow-hidden rounded-xl bg-surface shadow-2xl">
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="關閉廣告"
          className="absolute right-2 top-2 z-10 grid size-8 place-items-center rounded-full bg-black/50 text-white hover:bg-black/70"
        >
          ✕
        </button>

        {ad.linkUrl ? (
          <a
            href={ad.linkUrl}
            onClick={() => setOpen(false)}
            className="block"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ad.imageUrl} alt={ad.name} className="block w-full" />
          </a>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ad.imageUrl} alt={ad.name} className="block w-full" />
        )}

        <div className="flex items-center justify-between px-4 py-2 text-xs text-muted">
          <span>廣告</span>
          {ad.dismissSeconds > 0 ? (
            <span className="tabular-nums">{left} 秒後自動關閉</span>
          ) : (
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="font-medium text-brand hover:underline"
            >
              關閉
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
