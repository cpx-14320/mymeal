"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
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
import type { PageNavItem } from "./nav";

export const DEMO_AUTH_KEY = "mymeal-demo-authed";

/**
 * 全站外框：Header（置頂）＋ Sidebar（桌機固定 / 行動版抽屜）＋ Footer。
 * 由 app/layout.tsx 包住所有頁面，改這裡即全站同步。
 *
 * 目前為「預覽模式」：所有頁面開放瀏覽、不鎖權限。
 * 登入狀態＝真實 session（`isSessionAuthed`，伺服器算好傳進來）「或」`demoAuthed`
 * （Header 頭像按鈕控制、存 localStorage 的預覽開關，讓沒有真的登入也能預覽會員畫面）。
 * 真實 session 一律優先：只要有真的登入，就算沒開過預覽開關也會顯示已登入畫面。
 */
export function AppShell({
  children,
  pages = [],
  announcement = "",
  walletBalance = 0,
  isSessionAuthed = false,
}: {
  children: ReactNode;
  /** 已上架的頁面，前台側欄用來動態多顯示一個連結（見 sidebar.tsx）；後台新增頁面就會同步出現。 */
  pages?: PageNavItem[];
  /** 後台「系統設定」的公告文字；空字串就不顯示。 */
  announcement?: string;
  /** 目前登入會員的真實錢包餘額（未登入時為 0），側欄「會員錢包」小工具用。 */
  walletBalance?: number;
  /** 是否有真實登入 session，伺服器端（app/(app)/layout.tsx）算好傳進來。 */
  isSessionAuthed?: boolean;
}) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [demoAuthed, setDemoAuthed] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const previewMode = true;
  const authed = isSessionAuthed || (mounted && demoAuthed);

  useEffect(() => {
    try {
      setDemoAuthed(localStorage.getItem(DEMO_AUTH_KEY) === "1");
    } catch {
      /* 私密視窗等情況忽略 */
    }
    setMounted(true);
  }, []);

  function loginDemo() {
    setDemoAuthed(true);
    try {
      localStorage.setItem(DEMO_AUTH_KEY, "1");
    } catch {
      /* 私密視窗等情況忽略 */
    }
  }

  /** 真正的登出：清掉伺服器 session cookie、清掉預覽用的登入狀態，並重新整理讓真實 session 狀態同步。 */
  async function logout() {
    setDemoAuthed(false);
    try {
      localStorage.setItem(DEMO_AUTH_KEY, "0");
    } catch {
      /* 私密視窗等情況忽略 */
    }
    await logoutAction();
    router.refresh();
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
          onLogout={logout}
        />

        <AnnouncementBanner announcement={announcement} />

        <div className="mx-auto flex w-full max-w-[1400px] flex-1">
          {/* 桌機：固定側欄 */}
          <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-64 shrink-0 border-r border-line bg-surface lg:block">
            <Sidebar
              previewMode={previewMode}
              isAuthed={authed}
              pages={pages}
              walletBalance={walletBalance}
            />
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
                    isAuthed={authed}
                    pages={pages}
                    walletBalance={walletBalance}
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
