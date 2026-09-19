"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { Footer } from "./footer";
import { CloseIcon } from "./icons";
import { GoTopButton } from "./go-top-button";
import { InterstitialOverlay } from "@/components/interstitial-overlay";
import { AnnouncementBanner } from "@/components/announcement-banner";
import { LoginModal } from "./login-modal";
import { LoginModalContext } from "./login-modal-context";
import { logoutAction } from "@/app/login/actions";
import type { SupplierNavItem } from "./nav";

export const DEMO_AUTH_KEY = "mymeal-demo-authed";

/**
 * 全站外框：Header（置頂）＋ Sidebar（桌機固定 / 行動版抽屜）＋ Footer。
 * 由 app/layout.tsx 包住所有頁面，改這裡即全站同步。
 *
 * 目前為「預覽模式」：所有頁面開放瀏覽、不鎖權限。
 * 之後接上登入系統後，把 previewMode 設為 false，並改用真實的 isAuthed / isAdmin。
 * `authed` 目前是 Header 頭像按鈕控制的預覽用登入狀態（存 localStorage），
 * 跟 Sidebar 共用，用來預覽「登入後顯示會員錢包區塊」等畫面。
 */
export function AppShell({
  children,
  suppliers = [],
  announcement = "",
}: {
  children: ReactNode;
  /** 已上架的店家，前台側欄用來動態多顯示一個連結（見 sidebar.tsx）；後台新增店家就會同步出現。 */
  suppliers?: SupplierNavItem[];
  /** 後台「系統設定」的公告文字；空字串就不顯示。 */
  announcement?: string;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const previewMode = true;

  useEffect(() => {
    try {
      setAuthed(localStorage.getItem(DEMO_AUTH_KEY) === "1");
    } catch {
      /* 私密視窗等情況忽略 */
    }
    setMounted(true);
  }, []);

  function toggleAuth() {
    setAuthed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(DEMO_AUTH_KEY, next ? "1" : "0");
      } catch {
        /* 私密視窗等情況忽略 */
      }
      return next;
    });
  }

  function loginDemo() {
    setAuthed(true);
    try {
      localStorage.setItem(DEMO_AUTH_KEY, "1");
    } catch {
      /* 私密視窗等情況忽略 */
    }
  }

  /** 真正的登出：清掉伺服器 session cookie，並跟著清掉這份預覽用的登入狀態。 */
  async function logout() {
    setAuthed(false);
    try {
      localStorage.setItem(DEMO_AUTH_KEY, "0");
    } catch {
      /* 私密視窗等情況忽略 */
    }
    await logoutAction();
  }

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  return (
    <LoginModalContext.Provider value={{ openLogin: () => setLoginOpen(true) }}>
      <div className="flex min-h-dvh flex-col bg-page">
        <Header
          onMenuClick={() => setDrawerOpen(true)}
          mounted={mounted}
          authed={authed}
          onToggleAuth={toggleAuth}
          onLogout={logout}
        />

        <AnnouncementBanner announcement={announcement} />

        <div className="mx-auto flex w-full max-w-[1400px] flex-1">
          {/* 桌機：固定側欄 */}
          <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-64 shrink-0 border-r border-line bg-surface lg:block">
            <Sidebar previewMode={previewMode} isAuthed={mounted && authed} suppliers={suppliers} />
          </aside>

          {/* 行動版：抽屜 */}
          {drawerOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div
                className="absolute inset-0 bg-black/40"
                onClick={() => setDrawerOpen(false)}
                aria-hidden="true"
              />
              <div
                role="dialog"
                aria-modal="true"
                aria-label="主選單"
                className="absolute inset-y-0 left-0 flex w-72 max-w-[82vw] flex-col bg-surface shadow-xl"
              >
                <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-4">
                  <span className="font-semibold text-ink">選單</span>
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(false)}
                    aria-label="關閉選單"
                    className="grid size-9 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink"
                  >
                    <CloseIcon className="h-5 w-5" />
                  </button>
                </div>
                <div className="min-h-0 flex-1">
                  <Sidebar
                    previewMode={previewMode}
                    isAuthed={mounted && authed}
                    suppliers={suppliers}
                    onNavigate={() => setDrawerOpen(false)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 內容 + 頁尾 */}
          <div className="flex min-w-0 flex-1 flex-col">
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </div>

        {/* 前台蓋台廣告（/admin 不顯示） */}
        <InterstitialOverlay />

        {/* 前台回到頂部按鈕（/admin 不顯示） */}
        <GoTopButton />

        <LoginModal
          open={loginOpen}
          onClose={() => setLoginOpen(false)}
          onLoginSuccess={loginDemo}
        />
      </div>
    </LoginModalContext.Provider>
  );
}
