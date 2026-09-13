import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/components/ui/primitives";
import { OrderRow, type Order } from "@/components/order-row";
import { OrdersHistory } from "@/components/orders-history";

export const metadata: Metadata = { title: "我的訂單" };

const active: Order[] = [
  {
    id: "a1",
    date: "09/10（三）",
    restaurant: "健康廚房",
    dish: "舒肥雞胸餐盒 ×1",
    price: 110,
    team: { name: "三樓週三團", id: "1" },
    status: "pending",
  },
  {
    id: "a2",
    date: "09/11（四）",
    restaurant: "阿明快餐",
    dish: "宮保雞丁便當 ×1",
    price: 90,
    team: { name: "設計部揪團", id: "2" },
    status: "confirmed",
  },
];

export default function OrdersPage() {
  return (
    <PageContainer>
      <PageHeader title="我的訂單" description="查看目前的訂餐與歷史紀錄。" />

      <section className="space-y-3">
        <h2 className="text-lg font-bold tracking-tight">進行中</h2>
        {active.map((o) => (
          <OrderRow key={o.id} order={o} showActions />
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold tracking-tight">歷史紀錄</h2>
        <OrdersHistory />
      </section>

      <p className="text-xs text-muted">＊此頁為介面預覽，資料為範例。</p>
    </PageContainer>
  );
}
