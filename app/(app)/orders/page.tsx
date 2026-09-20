import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/components/ui/primitives";
import { OrderRow, type Order, type OrderStatus } from "@/components/order-row";
import { OrdersHistory } from "@/components/orders-history";
import { listMemberOrderLines, type MemberOrderLine } from "@/lib/models/group-order";
import { getSessionMemberId } from "@/lib/session";

export const metadata: Metadata = { title: "我的訂單" };

// 這個 app 沒有另外的逐筆訂單審核流程，訂單狀態直接沿用它所屬團訂的狀態：
// 開放中／已截止都算還在走的訂單，已完成才算歷史紀錄。
const orderStatusByGroupStatus: Record<MemberOrderLine["status"], OrderStatus> = {
  open: "pending",
  closed: "confirmed",
  completed: "fulfilled",
};

function toOrder(l: MemberOrderLine): Order {
  return {
    id: l.lineId,
    date: l.date,
    restaurant: l.templateName,
    dish: `${l.itemName} ×${l.qty}`,
    price: l.price * l.qty,
    team: { name: l.groupOrderName, id: l.groupOrderId },
    status: orderStatusByGroupStatus[l.status],
  };
}

export default async function OrdersPage() {
  const memberId = await getSessionMemberId();
  if (!memberId) redirect("/login");

  const lines = await listMemberOrderLines(memberId);
  const active = lines.filter((l) => l.status !== "completed").map(toOrder);
  const history = lines.filter((l) => l.status === "completed").map(toOrder);

  return (
    <PageContainer>
      <PageHeader title="我的訂單" description="查看目前的訂餐與歷史紀錄。" />

      <section className="space-y-3">
        <h2 className="text-lg font-bold tracking-tight">進行中</h2>
        {active.length === 0 ? (
          <p className="text-sm text-muted">目前沒有進行中的訂單。</p>
        ) : (
          active.map((o) => <OrderRow key={o.id} order={o} showActions />)
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold tracking-tight">歷史紀錄</h2>
        <OrdersHistory rows={history} />
      </section>
    </PageContainer>
  );
}
