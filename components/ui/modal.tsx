"use client";

import { useEffect, type ReactNode } from "react";

/**
 * 共用的彈窗外殼：背景遮罩（點擊關閉）＋ Esc 關閉＋鎖背景捲動。
 * 內容用 children 傳入，標題列用 <ModalHeader> 搭配。
 */
export function Modal({
  open,
  onClose,
  ariaLabel,
  className = "max-w-[600px]",
  children,
}: {
  open: boolean;
  onClose: () => void;
  ariaLabel: string;
  className?: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
    >
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`relative flex max-h-[80vh] w-full flex-col overflow-hidden rounded-xl bg-surface shadow-2xl ${className}`}
      >
        {children}
      </div>
    </div>
  );
}

export function ModalHeader({
  title,
  subtitle,
  onClose,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-line px-4 py-3">
      <div>
        <p className="font-medium">{title}</p>
        {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="關閉"
        className="text-muted hover:text-ink"
      >
        ✕
      </button>
    </div>
  );
}
