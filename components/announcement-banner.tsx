"use client";

import { usePathname } from "next/navigation";

/** 全站公告 banner，內容來自後台「系統設定」；沒設定文字或在 /admin 底下就不顯示。 */
export function AnnouncementBanner({ announcement }: { announcement: string }) {
  const pathname = usePathname();
  const onFront = !pathname.startsWith("/admin");

  if (!onFront || !announcement) return null;

  return (
    <div className="border-b border-line bg-brand-soft px-4 py-2 text-center text-sm text-ink">
      {announcement}
    </div>
  );
}
