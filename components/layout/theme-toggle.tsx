"use client";

import { useEffect, useState } from "react";
import { SunIcon, MoonIcon } from "./icons";

type Mode = "light" | "dark";
const STORAGE_KEY = "mymeal-theme";

function resolveCurrent(): Mode {
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "light" || attr === "dark") return attr;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/** 白天 / 深夜切換。存 localStorage，重整後保留；沒設定過就跟隨系統。 */
export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<Mode>("light");

  useEffect(() => {
    setMode(resolveCurrent());
    setMounted(true);
  }, []);

  function toggle() {
    const next: Mode = mode === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* 私密視窗等情況忽略 */
    }
    setMode(next);
  }

  // 未掛載前先佔位，避免 hydration 不一致
  if (!mounted) {
    return <span className="size-9" aria-hidden="true" />;
  }

  const nextLabel = mode === "dark" ? "切換為白天模式" : "切換為深夜模式";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={nextLabel}
      title={nextLabel}
      className="grid size-9 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink"
    >
      {mode === "dark" ? (
        <MoonIcon className="h-[18px] w-[18px]" />
      ) : (
        <SunIcon className="h-[18px] w-[18px]" />
      )}
    </button>
  );
}
