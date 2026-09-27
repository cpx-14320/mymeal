import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { listPages } from "@/lib/models/page";
import { getSessionMemberId } from "@/lib/session";
import { getMemberBalance } from "@/lib/models/wallet";
import { listDepartments, listUnits } from "@/lib/models/org";
import { getMemberPermissions } from "@/lib/models/role";
import { getMemberAvatarUrl } from "@/lib/models/member";

export default async function AppGroupLayout({ children }: { children: ReactNode }) {
  const memberId = await getSessionMemberId();
  const [pages, walletBalance, departments, units, adminPermissions, avatarUrl] = await Promise.all([
    listPages(),
    memberId ? getMemberBalance(memberId) : Promise.resolve(0),
    // 註冊表單要用的部門/單位——已登入的人用不到登入/註冊彈窗，不用多查這兩個。
    memberId ? Promise.resolve([]) : listDepartments(),
    memberId ? Promise.resolve([]) : listUnits(),
    // 側欄「後台管理」跟後台內部各項目要不要顯示，看會員組別套用了哪些權限鍵。
    memberId ? getMemberPermissions(memberId) : Promise.resolve({}),
    memberId ? getMemberAvatarUrl(memberId) : Promise.resolve(undefined),
  ]);
  const activePages = pages
    .filter((s) => s.active)
    .map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      icon: s.icon,
      iconSvg: s.iconSvg,
      slug: s.slug,
      openInNewTab: s.openInNewTab,
    }));

  return (
    <AppShell
      pages={activePages}
      walletBalance={walletBalance}
      isSessionAuthed={!!memberId}
      registerDepartments={departments}
      registerUnits={units}
      adminPermissions={adminPermissions}
      avatarUrl={avatarUrl}
    >
      {children}
    </AppShell>
  );
}
