import Link from "next/link";
import { Card, CardBody, Badge, Button } from "@/components/ui/primitives";

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

export function OrderRow({
  order,
  showActions,
}: {
  order: Order;
  showActions?: boolean;
}) {
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
        </div>
        <div className="flex items-center gap-3">
          <span className="font-semibold tabular-nums text-brand">
            NT$ {order.price}
          </span>
          {showActions && (
            <div className="flex gap-2">
              <Button variant="secondary" size="sm">
                修改
              </Button>
              <Button variant="danger" size="sm">
                取消
              </Button>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
