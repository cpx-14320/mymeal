"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardBody, Badge, Button, ButtonLink } from "@/components/ui/primitives";
import { cancelMemberLineAction } from "@/app/(app)/group-orders/[id]/actions";

export type OrderStatus = "pending" | "confirmed" | "fulfilled" | "cancelled";

export const orderStatusMap: Record<
  OrderStatus,
  { label: string; tone: "warning" | "positive" | "neutral" | "danger" }
> = {
  pending: { label: "待確認", tone: "warning" },
  confirmed: { label: "已確認", tone: "positive" },
  fulfilled: { label: "已出餐", tone: "neutral" },
  cancelled: { label: "已取消", tone: "danger" },
};

export interface Order {
  id: string;
  date: string;
  restaurant: string;
  dish: string;
  price: number;
  team: { name: string; id: string };
  status: OrderStatus;
}

/** 「修改」直接連到這個團的頁面重新點餐（確認餐點本來就是整批取代，不用另外做編輯表單）；
 *  「取消」是真的把這一行從團訂裡刪掉，錢包扣款已經扣過的話會先退款，二次確認避免手滑。 */
export function OrderRow({
  order,
  showActions,
}: {
  order: Order;
  showActions?: boolean;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function handleCancel() {
    setPending(true);
    setError(undefined);
    const result = await cancelMemberLineAction(order.team.id, order.id);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <Card>
      <CardBody className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium">{order.dish}</span>
            <Badge tone={orderStatusMap[order.status].tone}>
              {orderStatusMap[order.status].label}
            </Badge>
          </div>
          <p className="mt-0.5 text-sm text-muted">
            {order.date}．{order.restaurant}．
            <Link
              href={`/group-orders/${order.team.id}`}
              className="hover:text-brand"
            >
              {order.team.name}
            </Link>
          </p>
          {error && <p className="mt-1 text-xs text-danger">{error}</p>}
        </div>
        <div className="flex items-center gap-3">
          <span className="font-semibold tabular-nums text-brand">
            NT$ {order.price}
          </span>
          {showActions &&
            (confirming ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-danger">確定取消？</span>
                <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={() => setConfirming(false)}>
                  返回
                </Button>
                <Button variant="danger" size="sm" disabled={pending} onClick={handleCancel}>
                  {pending ? "取消中…" : "確認"}
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <ButtonLink href={`/group-orders/${order.team.id}`} variant="secondary" size="sm">
                  修改
                </ButtonLink>
                <Button variant="danger" size="sm" onClick={() => setConfirming(true)}>
                  取消
                </Button>
              </div>
            ))}
        </div>
      </CardBody>
    </Card>
  );
}
