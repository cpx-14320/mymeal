"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, inputClass } from "@/components/ui/primitives";
import type { RiceLevel } from "@/lib/models/group-order";
import { submitGroupOrderLinesAction } from "@/app/(app)/group-orders/[id]/actions";

const riceLevels: RiceLevel[] = ["normal", "half", "none"];
const riceLevelLabel: Record<RiceLevel, string> = { normal: "正常", half: "半飯", none: "不要飯" };

export interface OrderableDish {
  id: string;
  name: string;
  emoji: string;
  price: number;
}

export interface ExistingLine {
  itemId: string;
  qty: number;
  rice: RiceLevel;
  note: string;
}

interface DishOrder {
  qty: number;
  rice: RiceLevel;
}

export function GroupOrderForm({
  groupOrderId,
  dishes,
  recommendedDishIds = [],
  existingLines,
  memberId,
  memberName,
  walletBalance,
}: {
  groupOrderId: string;
  dishes: OrderableDish[];
  /** 依這位會員過去點餐次數排出的推薦品項 id（已篩過，一定是這個團的模板裡有的品項）。 */
  recommendedDishIds?: string[];
  existingLines: ExistingLine[];
  memberId: string;
  memberName: string;
  walletBalance: number;
}) {
  const router = useRouter();
  const [orders, setOrders] = useState<Record<string, DishOrder>>(() => {
    const initial: Record<string, DishOrder> = {};
    for (const l of existingLines) initial[l.itemId] = { qty: l.qty, rice: l.rice };
    return initial;
  });
  const [note, setNote] = useState(existingLines[0]?.note ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const getOrder = (id: string): DishOrder => orders[id] ?? { qty: 0, rice: "normal" };

  const recommendedDishes = recommendedDishIds
    .map((id) => dishes.find((d) => d.id === id))
    .filter((d): d is OrderableDish => Boolean(d));

  const orderTotal = dishes.reduce((sum, d) => sum + getOrder(d.id).qty * d.price, 0);
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

  async function submit() {
    setPending(true);
    setError(undefined);
    const lines = dishes
      .map((d) => ({ ...getOrder(d.id), item: d }))
      .filter((l) => l.qty > 0)
      .map((l) => ({
        itemId: l.item.id,
        itemName: l.item.name,
        price: l.item.price,
        qty: l.qty,
        rice: l.rice,
        note,
      }));

    const result = await submitGroupOrderLinesAction(groupOrderId, memberId, memberName, lines);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <>
      {recommendedDishes.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">你可能喜歡的餐點</p>
          <div className="flex flex-wrap gap-2">
            {recommendedDishes.map((d) => {
              const order = getOrder(d.id);
              const selected = order.qty > 0;
              return (
                <div
                  key={d.id}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                    selected ? "border-brand bg-brand-soft" : "border-line"
                  }`}
                >
                  <span>{d.emoji}</span>
                  <span className="font-medium">{d.name}</span>
                  <span className="text-xs text-muted">NT$ {d.price}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setQty(d.id, -1)}
                      className="grid size-6 place-items-center rounded-md border border-line hover:bg-surface-2"
                    >
                      −
                    </button>
                    <span className="w-4 text-center tabular-nums">{order.qty}</span>
                    <button
                      type="button"
                      onClick={() => setQty(d.id, 1)}
                      className="grid size-6 place-items-center rounded-md border border-line hover:bg-surface-2"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
        <div className="grid grid-cols-2 gap-3 rounded-lg border border-line bg-surface-2 px-4 py-3">
          <div>
            <p className="text-xs text-muted">目前餘額</p>
            <p className="font-semibold tabular-nums">NT$ {walletBalance}</p>
          </div>
          <div>
            <p className="text-xs text-muted">預估餘額</p>
            <p className={`font-semibold tabular-nums ${estimatedBalance < 0 ? "text-danger" : ""}`}>
              NT$ {estimatedBalance}
            </p>
          </div>
        </div>
      </div>
      <input
        className={inputClass}
        placeholder="餐點備註（例：不要辣、不要香菜）"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button disabled={pending} onClick={submit}>
          {pending ? "送出中…" : "送出訂單"}
        </Button>
      </div>
    </>
  );
}
