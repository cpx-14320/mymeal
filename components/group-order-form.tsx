"use client";

import { useState } from "react";
import { Button, Card, inputClass } from "@/components/ui/primitives";
import {
  riceLevelLabel,
  paymentMethods,
  paymentMethodLabel,
  currentMemberId,
  memberInsightById,
  type CatalogItem,
  type RiceLevel,
  type PaymentMethod,
} from "@/lib/mock";

const riceLevels: RiceLevel[] = ["normal", "half", "none"];

interface DishOrder {
  qty: number;
  rice: RiceLevel;
}

export function GroupOrderForm({ dishes }: { dishes: CatalogItem[] }) {
  const [orders, setOrders] = useState<Record<string, DishOrder>>({});
  const [note, setNote] = useState("");
  const [payment, setPayment] = useState<PaymentMethod>("wallet");

  // 與 /wallet、側邊欄的會員錢包同一份資料，確保餘額顯示同步
  const walletBalance = memberInsightById(currentMemberId)?.balance ?? 0;

  const getOrder = (id: string): DishOrder => orders[id] ?? { qty: 0, rice: "normal" };

  const orderTotal = dishes.reduce(
    (sum, d) => sum + getOrder(d.id).qty * d.price,
    0,
  );
  const estimatedBalance = walletBalance - orderTotal;

  const setQty = (id: string, delta: number) =>
    setOrders((prev) => {
      const cur = prev[id] ?? { qty: 0, rice: "normal" as RiceLevel };
      return { ...prev, [id]: { ...cur, qty: Math.max(0, cur.qty + delta) } };
    });

  const setRice = (id: string, rice: RiceLevel) =>
    setOrders((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? { qty: 0, rice: "normal" }), rice },
    }));

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {dishes.map((d) => {
          const order = getOrder(d.id);
          const selected = order.qty > 0;
          return (
            <Card
              key={d.id}
              className={`relative overflow-hidden ${
                selected ? "ring-2 ring-brand" : ""
              }`}
            >
              <div className="grid h-32 place-items-center bg-brand-soft text-5xl">
                {d.emoji}
              </div>
              {selected && (
                <span className="absolute right-2 top-2 rounded-full bg-brand px-2 py-0.5 text-xs font-semibold text-brand-fg shadow">
                  已選 {order.qty} 份
                </span>
              )}
              <div className="space-y-3 p-4">
                <div>
                  <p className="font-medium">{d.name}</p>
                  <p className="text-sm text-muted">NT$ {d.price}</p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-1">
                    {riceLevels.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRice(d.id, r)}
                        className={`rounded-full border px-2.5 py-1 text-xs ${
                          order.rice === r
                            ? "border-brand bg-brand-soft text-brand"
                            : "border-line text-muted hover:text-ink"
                        }`}
                      >
                        {riceLevelLabel[r]}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setQty(d.id, -1)}
                      className="grid size-7 place-items-center rounded-lg border border-line hover:bg-surface-2"
                    >
                      −
                    </button>
                    <span className="w-5 text-center tabular-nums">{order.qty}</span>
                    <button
                      type="button"
                      onClick={() => setQty(d.id, 1)}
                      className="grid size-7 place-items-center rounded-lg border border-line hover:bg-surface-2"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium">付款方式</p>
        <div className="flex flex-wrap gap-2">
          {paymentMethods.map((m) => (
            <label
              key={m}
              className="inline-flex cursor-pointer items-center rounded-full border border-line px-3 py-1.5 text-sm has-[:checked]:border-brand has-[:checked]:bg-brand-soft has-[:checked]:text-brand"
            >
              <input
                type="radio"
                name="payment-method"
                checked={payment === m}
                onChange={() => setPayment(m)}
                className="sr-only"
              />
              {paymentMethodLabel[m]}
            </label>
          ))}
        </div>

        {payment === "wallet" && (
          <div className="grid grid-cols-2 gap-3 rounded-lg border border-line bg-surface-2 px-4 py-3">
            <div>
              <p className="text-xs text-muted">目前餘額</p>
              <p className="font-semibold tabular-nums">
                NT$ {walletBalance}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted">預估餘額</p>
              <p
                className={`font-semibold tabular-nums ${
                  estimatedBalance < 0 ? "text-danger" : ""
                }`}
              >
                NT$ {estimatedBalance}
              </p>
            </div>
          </div>
        )}
      </div>
      <input
        className={inputClass}
        placeholder="餐點備註（例：不要辣、不要香菜）"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <div className="flex justify-end gap-2">
        <Button variant="secondary">修改</Button>
        <Button>送出訂單</Button>
      </div>
    </>
  );
}
