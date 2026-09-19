"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Brand } from "./brand";
import { MenuIcon, BellIcon, UserCircleIcon } from "./icons";
import { ThemeToggle } from "./theme-toggle";
import { REGISTER_HREF } from "./nav";
import { useLoginModal } from "./login-modal-context";

const notifications = [
  {
    title: "新品項上架：舒肥雞胸餐盒",
    at: "2026/09/11 09:00:00",
  },
  {
    title: "歡迎加入 MyMeal！先逛逛「所有品項」，收藏喜歡的口味吧",
    at: "2026/09/10 14:20:00",
  },
  {
    title: "您的儲值申請（NT$ 500）已核准",
    at: "2026/09/10 08:41:00",
  },
];

interface HeaderProps {
  /** 開啟行動版側欄抽屜 */
  onMenuClick: () => void;
  /** 是否已掛載（避免 SSR/CSR 不一致），掛載前先不顯示登入相關狀態 */
  mounted: boolean;
  /** 預覽用登入狀態，跟側欄共用同一份（見 AppShell） */
  authed: boolean;
  /** 切換預覽登入狀態（訪客狀態下的「預覽切換為已登入」按鈕用） */
  onToggleAuth: () => void;
  /** 真正登出（清掉 session cookie） */
  onLogout: () => void;
}

export function Header({ onMenuClick, mounted, authed, onToggleAuth, onLogout }: HeaderProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const { openLogin } = useLoginModal();

  useEffect(() => {
    if (!notifOpen) return;
    const onClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [notifOpen]);

  function toggleDemoAuth() {
    setNotifOpen(false);
    onToggleAuth();
  }

  function handleLogout() {
    setNotifOpen(false);
    onLogout();
  }

  return (
    <header className="sticky top-0 z-40 h-14 border-b border-line bg-surface/85 backdrop-blur">
      <div className="mx-auto flex h-full max-w-[1400px] items-center gap-3 px-4 sm:px-6">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="開啟選單"
          className="-ml-1 grid size-9 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink lg:hidden"
        >
          <MenuIcon className="h-5 w-5" />
        </button>

        <Brand />

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <ThemeToggle />

          {mounted && authed ? (
            <>
              <div className="relative" ref={notifRef}>
                <button
                  type="button"
                  onClick={() => setNotifOpen((v) => !v)}
                  aria-label="通知"
                  className="relative grid size-9 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink"
                >
                  <BellIcon className="h-5 w-5" />
                  <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-danger" />
                </button>

                {notifOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 max-w-[90vw] rounded-xl border border-line bg-surface shadow-xl">
                    <div className="border-b border-line px-3 py-2 text-sm font-medium">
                      通知
                    </div>
                    <ul className="max-h-80 divide-y divide-line overflow-y-auto">
                      {notifications.map((n, i) => (
                        <li key={i} className="px-3 py-2.5 text-sm">
                          <p>{n.title}</p>
                          <p className="mt-0.5 text-xs text-muted">{n.at}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleLogout}
                aria-label="登出"
                title="登出"
                className="grid size-9 place-items-center rounded-full text-brand hover:bg-surface-2"
              >
                <UserCircleIcon className="h-7 w-7" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={openLogin}
                className="rounded-lg px-3 py-2 text-sm font-medium text-ink hover:bg-surface-2"
              >
                登入
              </button>
              <Link
                href={REGISTER_HREF}
                className="rounded-lg bg-brand px-3.5 py-2 text-sm font-semibold text-brand-fg hover:opacity-90"
              >
                申請帳號
              </Link>
              {mounted && (
                <button
                  type="button"
                  onClick={toggleDemoAuth}
                  aria-label="預覽：點擊切換為已登入狀態"
                  title="預覽：點擊切換為已登入狀態"
                  className="grid size-9 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ink"
                >
                  <UserCircleIcon className="h-6 w-6" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
