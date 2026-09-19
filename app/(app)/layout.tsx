import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { listSuppliers } from "@/lib/models/supplier";
import { getAnnouncement } from "@/lib/models/settings";
import { getSessionMemberId } from "@/lib/session";
import { getMemberBalance } from "@/lib/models/wallet";

export default async function AppGroupLayout({ children }: { children: ReactNode }) {
  const memberId = await getSessionMemberId();
  const [suppliers, announcement, walletBalance] = await Promise.all([
    listSuppliers(),
    getAnnouncement(),
    memberId ? getMemberBalance(memberId) : Promise.resolve(0),
  ]);
  const activeSuppliers = suppliers
    .filter((s) => s.active)
    .map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      icon: s.icon,
      slug: s.slug,
      openInNewTab: s.openInNewTab,
    }));

  return (
    <AppShell suppliers={activeSuppliers} announcement={announcement} walletBalance={walletBalance}>
      {children}
    </AppShell>
  );
}
