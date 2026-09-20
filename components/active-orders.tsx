"use client";

import { useState } from "react";
import { PillTabs } from "@/components/ui/primitives";
import { OrderRow, type Order, type OrderStatus } from "@/components/order-row";

type Tab = "all" | OrderStatus;

/** 「進行中」區塊：待確認／已截止分 tab 顯示，跟 OrdersHistory 一樣拆成獨立 client 元件
 *  是因為 PillTabs 的選取狀態要留在瀏覽器端，Server Component 沒辦法處理互動狀態。 */
export function ActiveOrders({ rows }: { rows: Order[] }) {
  const [tab, setTab] = useState<Tab>("all");

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "all", label: "全部", count: rows.length },
    { key: "pending", label: "待確認", count: rows.filter((o) => o.status === "pending").length },
    { key: "confirmed", label: "已截止", count: rows.filter((o) => o.status === "confirmed").length },
  ];

  const filtered = tab === "all" ? rows : rows.filter((o) => o.status === tab);

  return (
    <div className="space-y-3">
      <PillTabs tabs={tabs} value={tab} onChange={setTab} />

      {filtered.length === 0 ? (
        <p className="text-sm text-muted">這個分類目前沒有訂單。</p>
      ) : (
        filtered.map((o) => <OrderRow key={o.id} order={o} showActions />)
      )}
    </div>
  );
}
