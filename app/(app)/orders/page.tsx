import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/components/ui/primitives";
import { type Order } from "@/components/order-row";
import { ActiveOrders } from "@/components/active-orders";
import { OrdersHistory } from "@/components/orders-history";
import { listMemberOrderLines, type MemberOrderLine } from "@/lib/models/group-order";
import { getSessionMemberId } from "@/lib/session";
import { todayTaiwanDateString } from "@/lib/date";
import { riceLevelLabel } from "@/lib/mock";

export const metadata: Metadata = { title: "我的訂單" };

function toOrder(l: MemberOrderLine): Order {
  return {
    id: l.lineId,
    date: l.date,
    restaurant: l.templateName,
    // 同一品項選不同飯量會是各自獨立的一行，不帶上飯量的話兩行文字會一模一樣、看起來像重複。
    dish: `${l.itemName}（${riceLevelLabel[l.rice]}）×${l.qty}`,
    price: l.price * l.qty,
    team: { name: l.groupOrderName, id: l.groupOrderId },
    // 待確認＝團還開放中；已截止＝團不再開放中，但日期還沒過（見下面的分類）。
    // 這裡不看 "completed"，因為那只是後台一個人工按鈕，不代表真的已經出餐——
    // 用日期分「進行中」跟「歷史紀錄」才是客觀依據。
    status: l.status === "open" ? "pending" : "confirmed",
  };
}

export default async function OrdersPage() {
  const memberId = await getSessionMemberId();
  if (!memberId) redirect("/login");

  const today = todayTaiwanDateString();
  const lines = await listMemberOrderLines(memberId);

  const active = lines
    .filter((l) => l.status === "open" || l.date >= today)
    .map(toOrder);
  const history = lines
    .filter((l) => l.status !== "open" && l.date < today)
    .map(toOrder);

  return (
    <PageContainer>
      <PageHeader title="我的訂單" description="查看目前的訂餐與歷史紀錄。" />

      <section className="space-y-3">
        <h2 className="text-lg font-bold tracking-tight">進行中</h2>
        <ActiveOrders rows={active} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold tracking-tight">歷史紀錄</h2>
        <OrdersHistory rows={history} />
      </section>
    </PageContainer>
  );
}
