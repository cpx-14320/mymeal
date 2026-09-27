"use client";

import type { ReactNode } from "react";
import { useLoginModal, type LoginModalMode } from "./login-modal-context";

/** 純文字/樣式沿用外部傳入，點擊只是跳出登入／申請帳號彈窗——讓 server component 頁面也能有這顆按鈕。 */
export function LoginButton({
  mode = "login",
  className,
  children,
}: {
  mode?: LoginModalMode;
  className?: string;
  children: ReactNode;
}) {
  const { openLogin } = useLoginModal();
  return (
    <button type="button" onClick={() => openLogin(mode)} className={className}>
      {children}
    </button>
  );
}
