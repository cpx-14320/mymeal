"use client";

import type { ReactNode } from "react";
import { useLoginModal } from "./login-modal-context";

/** 純文字/樣式沿用外部傳入，點擊只是跳出登入彈窗——讓 server component 頁面也能有登入按鈕。 */
export function LoginButton({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const { openLogin } = useLoginModal();
  return (
    <button type="button" onClick={openLogin} className={className}>
      {children}
    </button>
  );
}
