import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { listSuppliers } from "@/lib/models/supplier";
import { getAnnouncement } from "@/lib/models/settings";

export default async function AppGroupLayout({ children }: { children: ReactNode }) {
  const [suppliers, announcement] = await Promise.all([listSuppliers(), getAnnouncement()]);
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
    <AppShell suppliers={activeSuppliers} announcement={announcement}>
      {children}
    </AppShell>
  );
}
