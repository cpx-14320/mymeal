"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navIcons, adminNavIcons, PageIcon, ChevronDownIcon, LockIcon } from "./icons";
import {
  primaryNav,
  adminNav,
  resolveHref,
  type PageNavItem,
} from "./nav";
import { useLoginModal } from "./login-modal-context";

const ADMIN_NAV_COLLAPSE_KEY = "mymeal-admin-nav-collapsed";

interface SidebarProps {
  /** 目前是否已登入。訪客狀態下需登入的項目會導向登入頁並顯示鎖頭。 */
  isAuthed?: boolean;
  /** 是否為管理者。已登入但非管理者時，「後台管理」等項目會隱藏。 */
  isAdmin?: boolean;
  /**
   * 預覽模式：先開放所有頁面，不做權限鎖定、不顯示鎖頭與訪客提示。
   * 之後接上登入系統後改為 false，改用 isAuthed / isAdmin。
   */
  previewMode?: boolean;
  /** 行動版抽屜中，點擊項目後關閉抽屜 */
  onNavigate?: () => void;
  /** 已上架的頁面，動態多顯示在主導覽最後——後台新增頁面就會同步出現，目前頁面內容先空著。 */
  pages?: PageNavItem[];
  /** 目前登入會員的真實錢包餘額，「會員錢包」小工具用。 */
  walletBalance?: number;
}

export function Sidebar({
  isAuthed = false,
  isAdmin = false,
  previewMode = false,
  onNavigate,
  pages = [],
  walletBalance = 0,
}: SidebarProps) {
  const pathname = usePathname();
  const inAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  const { openLogin } = useLoginModal();

  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    () => new Set(),
  );
  const loadedCollapse = useRef(false);

  // 用最長（最精確）符合的 href 作為 active 項目，
  // 避免巢狀路由（例如 /admin/items/[id]）同時命中父層與自己。
  const activeAdminHref = adminNav
    .flatMap((group) => group.items)
    .filter((item) =>
      item.href === "/admin"
        ? pathname === "/admin"
        : pathname === item.href || pathname.startsWith(`${item.href}/`),
    )
    .reduce<string | null>(
      (best, item) =>
        !best || item.href.length > best.length ? item.href : best,
      null,
    );

  const isItemActive = (href: string) => href === activeAdminHref;

  // 讀取上次收合狀態，並確保目前所在頁面所屬的組會自動展開一次
  // （之後使用者若手動再收合該組，這裡不會再蓋回去）。
  useEffect(() => {
    if (!inAdmin) return;
    setCollapsedGroups((prev) => {
      let base = prev;
      if (!loadedCollapse.current) {
        loadedCollapse.current = true;
        try {
          const stored = JSON.parse(
            localStorage.getItem(ADMIN_NAV_COLLAPSE_KEY) ?? "[]",
          ) as string[];
          base = new Set(stored);
        } catch {
          base = prev;
        }
      }
      const activeGroup = adminNav.find((g) =>
        g.items.some((item) => isItemActive(item.href)),
      );
      if (activeGroup && base.has(activeGroup.key)) {
        const next = new Set(base);
        next.delete(activeGroup.key);
        return next;
      }
      return base;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inAdmin, pathname]);

  function toggleGroup(key: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      try {
        localStorage.setItem(
          ADMIN_NAV_COLLAPSE_KEY,
          JSON.stringify([...next]),
        );
      } catch {
        /* 私密視窗等情況忽略 */
      }
      return next;
    });
  }

  /* ── 後台管理：側欄改顯示後台導覽 ───────────────────── */
  if (inAdmin) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-line px-3 py-3">
          <Link
            href="/menu"
            onClick={onNavigate}
            className="flex items-center gap-1.5 text-sm text-muted hover:text-ink"
          >
            <span aria-hidden="true">←</span> 返回前台
          </Link>
          <p className="mt-1.5 px-1 text-xs font-semibold tracking-wide text-brand">
            後台管理
          </p>
        </div>

        <nav className="flex-1 space-y-3 overflow-y-auto p-3">
          {adminNav.map((group) => {
            const expanded = !group.label || !collapsedGroups.has(group.key);

            return (
              <div key={group.key}>
                {group.label && (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.key)}
                    aria-expanded={expanded}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-xs font-medium text-muted hover:text-ink"
                  >
                    {group.label}
                    <ChevronDownIcon
                      className={`h-3.5 w-3.5 shrink-0 transition-transform ${
                        expanded ? "" : "-rotate-90"
                      }`}
                    />
                  </button>
                )}
                {expanded && (
                  <div
                    className={`space-y-0.5 ${
                      group.label ? "pl-2.5" : ""
                    }`}
                  >
                    {group.items.map((item) => {
                      const Icon = adminNavIcons[item.key];
                      const active = isItemActive(item.href);
                      return (
                        <Link
                          key={item.key}
                          href={item.href}
                          onClick={onNavigate}
                          aria-current={active ? "page" : undefined}
                          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                            active
                              ? "bg-brand-soft font-medium text-ink"
                              : "text-muted hover:bg-surface-2 hover:text-ink"
                          }`}
                        >
                          <Icon
                            className={`h-[18px] w-[18px] shrink-0 ${
                              active ? "text-brand" : ""
                            }`}
                          />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    );
  }

  /* ── 前台：主導覽 ──────────────────────────────────── */
  const items = previewMode
    ? primaryNav
    : primaryNav.filter(
        (item) => !(item.requiresAdmin && isAuthed && !isAdmin),
      );

  return (
    <div className="flex h-full flex-col">
      {isAuthed && (
        <Link
          href="/wallet"
          onClick={onNavigate}
          className="block border-b border-line px-4 py-3 hover:bg-surface-2"
        >
          <p className="text-xs text-muted">目前餘額</p>
          <p className="mt-0.5 text-lg font-bold tabular-nums text-brand">
            NT$ {walletBalance}
          </p>
        </Link>
      )}

      {!previewMode && !isAuthed && (
        <div className="border-b border-line px-4 py-3">
          <p className="text-xs text-muted">訪客瀏覽中</p>
          <button
            type="button"
            onClick={() => {
              onNavigate?.();
              openLogin();
            }}
            className="text-sm font-medium text-brand hover:underline"
          >
            登入以使用所有功能 →
          </button>
        </div>
      )}

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {pages.length > 0 && (
          <div className="mb-1 border-b border-line pb-3.5">
            <p className="px-3 pb-1 text-xs font-medium text-muted">頁面</p>
            {pages.map((page) => {
              const href = `/pages/${page.slug}`;
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={page.id}
                  href={href}
                  onClick={onNavigate}
                  target={page.openInNewTab ? "_blank" : undefined}
                  rel={page.openInNewTab ? "noopener noreferrer" : undefined}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-start gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    active ? "bg-brand-soft text-ink" : "text-ink hover:bg-surface-2"
                  }`}
                >
                  {page.iconSvg ? (
                    <span
                      className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center [&_svg]:h-full [&_svg]:w-full"
                      // 後台「頁面設定」的圖示 SVG 只有管理員能填寫，不是公開使用者輸入，屬於可信任內容。
                      dangerouslySetInnerHTML={{ __html: page.iconSvg }}
                    />
                  ) : page.icon ? (
                    <span className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center text-base leading-none">
                      {page.icon}
                    </span>
                  ) : (
                    <PageIcon
                      className={`mt-0.5 h-[18px] w-[18px] shrink-0 ${
                        active ? "text-brand" : "text-muted"
                      }`}
                    />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="font-medium">{page.name}</span>
                    {page.description && (
                      <span className="block truncate text-xs text-muted">{page.description}</span>
                    )}
                  </span>
                </Link>
              );
            })}
          </div>
        )}

        {items.map((item) => {
          const Icon = navIcons[item.key];
          const href = previewMode ? item.href : resolveHref(item, isAuthed);
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const locked = !previewMode && item.requiresAuth && !isAuthed;

          const link = (
            <Link
              key={item.key}
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`group flex items-start gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                active ? "bg-brand-soft text-ink" : "text-ink hover:bg-surface-2"
              }`}
            >
              <Icon
                className={`mt-0.5 h-[18px] w-[18px] shrink-0 ${
                  active ? "text-brand" : "text-muted group-hover:text-ink"
                }`}
              />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 font-medium">
                  {item.label}
                  {locked && <LockIcon className="h-3.5 w-3.5 text-muted" />}
                </span>
                <span className="block truncate text-xs text-muted">
                  {item.description}
                </span>
              </span>
            </Link>
          );

          // 分隔線畫在一個沒有圓角的純 div 上（跟上面「頁面」區塊的分隔線同一種做法），
          // 不要畫在有 rounded-lg 的連結本身上，不然線的兩端會被圓角修掉，兩條線看起來會不一樣長。
          if (item.requiresAdmin) {
            return (
              <div key={item.key} className="mt-1 border-t border-line pt-3.5">
                {link}
              </div>
            );
          }
          return link;
        })}
      </nav>
    </div>
  );
}
