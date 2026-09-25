"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { PROMO_PAGE_OPTIONS } from "@/lib/promo-pages";
import type { InterstitialView } from "@/lib/models/interstitial";
import { getEnabledInterstitialsAction } from "@/app/(app)/interstitial-actions";

/** 廣告的 showOnPages 有沒有任何一個版位的路徑前綴對得上目前頁面。 */
function matchesPathname(a: InterstitialView, pathname: string): boolean {
  return a.showOnPages.some((key) => {
    const opt = PROMO_PAGE_OPTIONS.find((o) => o.key === key);
    if (!opt) return false;
    return pathname === opt.prefix || pathname.startsWith(`${opt.prefix}/`);
  });
}

/** 「開啟」＋現在時間落在排程區間內＋有圖片，才算候選（跟後台 /admin/promos 的規則一致）。 */
function isShowing(a: InterstitialView, now: Date): boolean {
  if (!a.enabled) return false;
  if (a.imageUrl.trim() === "") return false;
  if (now < new Date(a.startAt)) return false;
  if (now > new Date(a.endAt)) return false;
  return true;
}

/**
 * 前台蓋台廣告：進站時全螢幕蓋住畫面，倒數後自動消失。
 * 每則廣告後台自己選要在哪些版位顯示（見 admin/promos 的「顯示版位」），不寫死在這個元件裡。
 * 候選清單（已開啟的廣告）來自真資料庫，排程時間窗依使用者本機時間判斷，留在前端算。
 */
export function InterstitialOverlay() {
  const pathname = usePathname();

  const [ad, setAd] = useState<InterstitialView | null>(null);
  const [left, setLeft] = useState(0);
  const [open, setOpen] = useState(false);

  // 掛載後才抓候選並判斷時間，避免 SSR 不一致
  useEffect(() => {
    let cancelled = false;

    getEnabledInterstitialsAction().then((candidates) => {
      if (cancelled) return;
      const now = new Date();
      const a = candidates.find((c) => isShowing(c, now) && matchesPathname(c, pathname));
      if (!a) return;

      try {
        const today = now.toISOString().slice(0, 10);
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
    });

    return () => {
      cancelled = true;
    };
  }, [pathname]);

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
