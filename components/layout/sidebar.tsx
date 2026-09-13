"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navIcons, adminNavIcons, ChevronDownIcon, LockIcon } from "./icons";
import {
  primaryNav,
  adminNav,
  footerNav,
  resolveHref,
} from "./nav";
import { currentMemberId, memberInsightById } from "@/lib/mock";
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
}

export function Sidebar({
  isAuthed = false,
  isAdmin = false,
  previewMode = false,
  onNavigate,
}: SidebarProps) {
  const pathname = usePathname();
  const inAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  const { openLogin } = useLoginModal();

  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    () => new Set(),
  );
  const loadedCollapse = useRef(false);

  const isItemActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

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

        <div className="border-t border-line p-3">
          <p className="px-3 text-[11px] text-muted">MyMeal v0.1 · 後台</p>
        </div>
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
          <p className="text-xs text-muted">會員錢包</p>
          <p className="mt-0.5 text-lg font-bold tabular-nums text-brand">
            NT$ {memberInsightById(currentMemberId)?.balance ?? 0}
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
        {items.map((item) => {
          const Icon = navIcons[item.key];
          const href = previewMode ? item.href : resolveHref(item, isAuthed);
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const locked = !previewMode && item.requiresAuth && !isAuthed;

          return (
            <Link
              key={item.key}
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`group flex items-start gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                item.requiresAdmin ? "mt-1 border-t border-line pt-3.5" : ""
              } ${
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
        })}
      </nav>

      <div className="border-t border-line p-3">
        <ul className="space-y-0.5">
          {footerNav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                className="block rounded-md px-3 py-1.5 text-xs text-muted hover:bg-surface-2 hover:text-ink"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <p className="px-3 pt-2 text-[11px] text-muted">MyMeal v0.1 · 內部系統</p>
      </div>
    </div>
  );
}
