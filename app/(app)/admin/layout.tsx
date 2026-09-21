import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminHeaderTitle } from "@/components/layout/admin-header-title";
import { AdminHeaderActionsProvider, AdminHeaderActionsSlot } from "@/components/layout/admin-header-actions";

export const metadata: Metadata = {
  title: { default: "後台管理", template: "%s · 後台管理 · MyMeal" },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
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
