import type { Metadata } from "next";
import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AdminHeaderTitle } from "@/components/layout/admin-header-title";
import { AdminHeaderActionsProvider, AdminHeaderActionsSlot } from "@/components/layout/admin-header-actions";
import { getSessionMemberId } from "@/lib/session";
import { getMemberPermissions } from "@/lib/models/role";
import { resolveAdminNavKey, type AdminNavKey } from "@/components/layout/nav";

export const metadata: Metadata = {
  title: { default: "後台管理", template: "%s · 後台管理 · MyMeal" },
};

// 「功能說明」（也就是 /admin 本身）是純參考資料，不是可調整資料的功能，只要是任一種
// 後台管理者都能看，跟 sidebar.tsx 決定要不要顯示這個連結的邏輯（alwaysVisibleKeys）
// 保持一致——也因為這樣，底下沒有權限時導回 /admin 一定安全，不會變成無限重導。
const ALWAYS_VISIBLE_KEYS = new Set<AdminNavKey>(["guide"]);

/**
 * 後台安全性第二層：middleware.ts 只確認「有沒有登入」，這裡進一步確認「這個人的組別
 * 有沒有後台權限、有沒有這個特定頁面的權限」——跟側欄選單決定要不要顯示連結用的是
 * 同一份權限資料（getMemberPermissions），差別是側欄只是隱藏連結（UI 層面），這裡是
 * 真的擋住，不管有沒有連結、直接打網址都一樣會被導開。
 * 完全沒有登入的防護本來已經有 middleware 擋，這裡對 memberId 再檢查一次是防禦性寫法——
 * 就算 middleware 的 matcher 設定以後改壞、漏擋，這裡還有一層。
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const memberId = await getSessionMemberId();
  if (!memberId) redirect("/login");

  const permissions = await getMemberPermissions(memberId);
  const isAdmin = Object.values(permissions).some(Boolean);
  if (!isAdmin) redirect("/");

  const pathname = (await headers()).get("x-pathname") ?? "";
  const requiredKey = resolveAdminNavKey(pathname);
  // requiredKey 是 null 代表這個網址沒對應到任何已知的後台項目（例如漏掛進 adminNav）——
  // 這種情況只要求「是後台管理者」就放行，不會因為漏掛就把整個功能擋死；
  // 有對應到項目的話，就要求「這個人真的有這個功能的權限」，不是隨便一個後台權限就能進來。
  if (requiredKey && !ALWAYS_VISIBLE_KEYS.has(requiredKey) && !permissions[requiredKey]) {
    redirect("/admin");
  }

  return (
    <div className="admin-scope mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <AdminHeaderActionsProvider>
        <div className="mb-6 flex items-center justify-between gap-3 border-b border-line pb-4">
          <AdminHeaderTitle />
          <AdminHeaderActionsSlot />
        </div>
        {children}
      </AdminHeaderActionsProvider>
    </div>
  );
}
