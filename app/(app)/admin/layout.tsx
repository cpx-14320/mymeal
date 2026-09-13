import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: { default: "後台管理", template: "%s · 後台管理 · MyMeal" },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="admin-scope mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center gap-3 border-b border-line pb-4">
        <h1 className="text-xl font-bold tracking-tight">後台管理</h1>
        <Badge tone="warning">預覽模式．未鎖權限</Badge>
      </div>
      {children}
    </div>
  );
}
