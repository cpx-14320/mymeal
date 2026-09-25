"use client";

import { useEffect, useState } from "react";
import { ArrowUpIcon } from "./icons";

/** 右下角「回到頂部」按鈕，捲動超過一定距離才出現。前台、後台共用同一顆。 */
export function GoTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="回到頂部"
      className="fixed bottom-6 right-6 z-30 grid size-11 place-items-center rounded-full bg-brand text-brand-fg shadow-lg hover:opacity-90"
    >
      <ArrowUpIcon className="h-5 w-5" />
    </button>
  );
}
