import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { listPages } from "@/lib/models/page";
import { getSessionMemberId } from "@/lib/session";
import { getMemberBalance } from "@/lib/models/wallet";

export default async function AppGroupLayout({ children }: { children: ReactNode }) {
  const memberId = await getSessionMemberId();
  const [pages, walletBalance] = await Promise.all([
    listPages(),
    memberId ? getMemberBalance(memberId) : Promise.resolve(0),
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
    <AppShell pages={activePages} walletBalance={walletBalance} isSessionAuthed={!!memberId}>
      {children}
    </AppShell>
  );
}
