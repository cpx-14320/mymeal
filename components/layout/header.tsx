"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Brand } from "./brand";
import { MenuIcon, BellIcon, UserCircleIcon } from "./icons";
import { ThemeToggle } from "./theme-toggle";
import { useLoginModal } from "./login-modal-context";
import type { NotificationView } from "@/lib/models/notification";
import { getEnabledNotificationsAction } from "@/app/(app)/notification-actions";

const READ_KEY = "mymeal-notifications-read";

function loadReadIds(): Set<string> {
  try {
    const raw = localStorage.getItem(READ_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveReadIds(ids: Set<string>) {
  try {
    localStorage.setItem(READ_KEY, JSON.stringify([...ids]));
  } catch {
    /* 私密視窗等情況忽略 */
  }
}

interface HeaderProps {
  /** 開啟行動版側欄抽屜 */
  onMenuClick: () => void;
  /** 是否已掛載（避免 SSR/CSR 不一致）；只用來延後顯示「預覽切換」按鈕等純本機的狀態 */
  mounted: boolean;
  /** 是否已登入（真實 session 或預覽開關），跟側欄共用同一份（見 AppShell） */
  authed: boolean;
  /** 真正登出（清掉 session cookie） */
  onLogout: () => void;
  /** 目前會員的大頭貼網址，沒上傳過就顯示預設的人形圖示。 */
  avatarUrl?: string;
}

export function Header({ onMenuClick, mounted, authed, onLogout, avatarUrl }: HeaderProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { openLogin } = useLoginModal();

  const [notifications, setNotifications] = useState<NotificationView[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set());
  const hasUnread = notifications.some((n) => !readIds.has(n.id));

  // 掛載後（且已登入）才抓通知清單，避免 SSR/CSR 不一致；同時讀取本機已讀紀錄。
  useEffect(() => {
    if (!mounted || !authed) return;
    setReadIds(loadReadIds());
    let cancelled = false;
    getEnabledNotificationsAction().then((list) => {
      if (!cancelled) setNotifications(list);
    });
    return () => {
      cancelled = true;
    };
  }, [mounted, authed]);

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

  useEffect(() => {
    if (!userMenuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [userMenuOpen]);

  function toggleNotifOpen() {
    setNotifOpen((v) => {
      const next = !v;
      if (next && notifications.length > 0) {
        const merged = new Set(readIds);
        notifications.forEach((n) => merged.add(n.id));
        setReadIds(merged);
        saveReadIds(merged);
      }
      return next;
    });
  }

  function handleLogout() {
    setNotifOpen(false);
    setUserMenuOpen(false);
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

          {authed ? (
            <>
              <div className="relative" ref={notifRef}>
                <button
                  type="button"
                  onClick={toggleNotifOpen}
                  aria-label="通知"
                  className="relative grid size-9 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink"
                >
                  <BellIcon className="h-5 w-5" />
                  {hasUnread && <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-danger" />}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 max-w-[90vw] rounded-xl border border-line bg-surface shadow-xl">
                    <div className="border-b border-line px-3 py-2 text-sm font-medium">
                      通知
                    </div>
                    {notifications.length === 0 ? (
                      <p className="px-3 py-6 text-center text-sm text-muted">目前沒有通知</p>
                    ) : (
                      <ul className="max-h-80 divide-y divide-line overflow-y-auto">
                        {notifications.map((n) =>
                          n.linkUrl ? (
                            <li key={n.id}>
                              <Link
                                href={n.linkUrl}
                                onClick={() => setNotifOpen(false)}
                                className="block px-3 py-2.5 text-sm hover:bg-surface-2"
                              >
                                <p className="font-medium">{n.title}</p>
                                <p className="mt-0.5 text-muted">{n.message}</p>
                              </Link>
                            </li>
                          ) : (
                            <li key={n.id} className="px-3 py-2.5 text-sm">
                              <p className="font-medium">{n.title}</p>
                              <p className="mt-0.5 text-muted">{n.message}</p>
                            </li>
                          ),
                        )}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              <div
                className="relative"
                ref={userMenuRef}
                onMouseEnter={() => setUserMenuOpen(true)}
                onMouseLeave={() => setUserMenuOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((v) => !v)}
                  aria-label="帳號選單"
                  aria-haspopup="menu"
                  aria-expanded={userMenuOpen}
                  className="grid size-9 place-items-center overflow-hidden rounded-full text-brand hover:bg-surface-2"
                >
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="" className="size-full object-cover" />
                  ) : (
                    <UserCircleIcon className="h-7 w-7" />
                  )}
                </button>

                {userMenuOpen && (
                  // 外層從按鈕底部直接無縫接上（top-full，沒有 margin），用 padding 撐出視覺間距——
                  // 這段 padding 仍算在這個 div 的可 hover 範圍內，滑鼠從按鈕移到選單途中才不會
                  // 經過一段沒有任何元素接住的空隙，導致 mouseleave 提早觸發、選單消失。
                  <div className="absolute right-0 top-full w-40 pt-2">
                    <div
                      role="menu"
                      className="overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-xl"
                    >
                      <Link
                        href="/account"
                        role="menuitem"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-3 py-2 text-sm hover:bg-surface-2"
                      >
                        會員資料
                      </Link>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={handleLogout}
                        className="block w-full px-3 py-2 text-left text-sm text-danger hover:bg-surface-2"
                      >
                        登出
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => openLogin()}
                className="rounded-lg px-3 py-2 text-sm font-medium text-ink hover:bg-surface-2"
              >
                登入
              </button>
              <button
                type="button"
                onClick={() => openLogin("register")}
                className="rounded-lg bg-brand px-3.5 py-2 text-sm font-semibold text-brand-fg hover:opacity-90"
              >
                申請帳號
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
