"use client";

import { createContext, useContext } from "react";

interface LoginModalContextValue {
  openLogin: () => void;
}

export const LoginModalContext = createContext<LoginModalContextValue | null>(null);

/** 任何頁面/元件都可以呼叫 openLogin() 跳出登入彈窗，不用各自管理彈窗開關狀態。 */
export function useLoginModal() {
  const ctx = useContext(LoginModalContext);
  if (!ctx) {
    throw new Error("useLoginModal must be used within AppShell");
  }
  return ctx;
}
