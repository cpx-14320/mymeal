"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, inputClass, ItemThumbnail, ItemThumbnailFill } from "@/components/ui/primitives";
import type { RiceLevel } from "@/lib/models/group-order";
import { submitGroupOrderLinesAction } from "@/app/(app)/group-orders/[id]/actions";

const riceLevels: RiceLevel[] = ["normal", "half", "none"];
const riceLevelLabel: Record<RiceLevel, string> = { normal: "正常", half: "半飯", none: "不要飯" };
const paymentMethods = ["錢包扣款", "餐券", "現金", "銀行轉帳"];

export interface OrderableDish {
  id: string;
  name: string;
  emoji: string;
  price: number;
  imageUrl?: string;
}

export interface ExistingLine {
  itemId: string;
  qty: number;
  rice: RiceLevel;
  note: string;
  paymentMethod: string;
  bankCode: string;
}

/** 同一品項可以同時點不同飯量（例如正常飯 1 份＋半飯 1 份），所以份數要分開存，不能只有一組 qty+rice。 */
type RiceQtyMap = Partial<Record<RiceLevel, number>>;

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
  const [orders, setOrders] = useState<Record<string, RiceQtyMap>>(() => {
    const initial: Record<string, RiceQtyMap> = {};
    for (const l of existingLines) {
      initial[l.itemId] = { ...initial[l.itemId], [l.rice]: l.qty };
    }
    return initial;
  });
  const [note, setNote] = useState(existingLines[0]?.note ?? "");
  const [paymentMethod, setPaymentMethod] = useState(existingLines[0]?.paymentMethod || paymentMethods[0]);
  const [bankCode, setBankCode] = useState(existingLines[0]?.bankCode ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const getQty = (id: string, rice: RiceLevel): number => orders[id]?.[rice] ?? 0;
  const getTotalQty = (id: string): number => riceLevels.reduce((sum, r) => sum + getQty(id, r), 0);

  const recommendedDishes = recommendedDishIds
    .map((id) => dishes.find((d) => d.id === id))
    .filter((d): d is OrderableDish => Boolean(d));

  const orderTotal = dishes.reduce((sum, d) => sum + getTotalQty(d.id) * d.price, 0);
  const estimatedBalance = walletBalance - orderTotal;

  const setQty = (id: string, rice: RiceLevel, delta: number) =>
    setOrders((prev) => {
      const cur = prev[id] ?? {};
      const nextQty = Math.max(0, (cur[rice] ?? 0) + delta);
      return { ...prev, [id]: { ...cur, [rice]: nextQty } };
    });

  async function submit() {
    setPending(true);
    setError(undefined);
    const lines = dishes
      .flatMap((d) => riceLevels.map((rice) => ({ item: d, rice, qty: getQty(d.id, rice) })))
      .filter((l) => l.qty > 0)
      .map((l) => ({
        itemId: l.item.id,
        itemName: l.item.name,
        price: l.item.price,
        qty: l.qty,
        rice: l.rice,
        note,
        paymentMethod,
        bankCode: paymentMethod === "銀行轉帳" ? bankCode : "",
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
              const totalQty = getTotalQty(d.id);
              const selected = totalQty > 0;
              return (
                <div
                  key={d.id}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                    selected ? "border-brand bg-brand-soft" : "border-line"
                  }`}
                >
                  <ItemThumbnail
                    imageUrl={d.imageUrl}
                    emoji={d.emoji}
                    alt={d.name}
                    size={20}
                    className="size-5 shrink-0 rounded object-cover"
                  />
                  <span className="font-medium">{d.name}</span>
                  <span className="text-xs text-muted">NT$ {d.price}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setQty(d.id, "normal", -1)}
                      className="grid size-6 place-items-center rounded-md border border-line hover:bg-surface-2"
                    >
                      −
                    </button>
                    <span className="w-4 text-center tabular-nums">{totalQty}</span>
                    <button
                      type="button"
                      onClick={() => setQty(d.id, "normal", 1)}
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

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {dishes.map((d) => {
          const totalQty = getTotalQty(d.id);
          const selected = totalQty > 0;
          return (
            <Card
              key={d.id}
              className={`relative overflow-hidden ${
                selected ? "ring-2 ring-brand" : ""
              }`}
            >
              <ItemThumbnailFill
                imageUrl={d.imageUrl}
                emoji={d.emoji}
                alt={d.name}
                sizes="33vw"
                containerClassName="relative grid aspect-[3/2] place-items-center overflow-hidden bg-brand-soft text-5xl"
              />
              {selected && (
                <span className="absolute right-2 top-2 rounded-full bg-brand px-2 py-0.5 text-xs font-semibold text-brand-fg shadow">
                  已選 {totalQty} 份
                </span>
              )}
              <div className="space-y-3 p-4">
                <div>
                  <p className="font-medium">{d.name}</p>
                  <p className="text-sm text-muted">NT$ {d.price}</p>
                </div>

                <div className="space-y-1.5">
                  {riceLevels.map((r) => {
                    const qty = getQty(d.id, r);
                    return (
                      <div key={r} className="flex items-center justify-between gap-2">
                        <span
                          className={`text-xs ${qty > 0 ? "font-medium text-brand" : "text-muted"}`}
                        >
                          {riceLevelLabel[r]}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setQty(d.id, r, -1)}
                            className="grid size-7 place-items-center rounded-lg border border-line hover:bg-surface-2"
                          >
                            −
                          </button>
                          <span className="w-5 text-center tabular-nums">{qty}</span>
                          <button
                            type="button"
                            onClick={() => setQty(d.id, r, 1)}
                            className="grid size-7 place-items-center rounded-lg border border-line hover:bg-surface-2"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
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
      <div className="space-y-2">
        <p className="text-sm font-medium">付款方式</p>
        <div className="flex flex-wrap gap-4 text-sm">
          {paymentMethods.map((m) => (
            <label key={m} className="flex items-center gap-2">
              <input
                type="radio"
                name="paymentMethod"
                value={m}
                checked={paymentMethod === m}
                onChange={() => setPaymentMethod(m)}
              />
              {m}
            </label>
          ))}
        </div>
        {paymentMethod === "銀行轉帳" && (
          <input
            className={inputClass}
            placeholder="請輸入匯款後5碼"
            value={bankCode}
            onChange={(e) => setBankCode(e.target.value)}
          />
        )}
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
          {pending ? "確認中…" : "確認餐點"}
        </Button>
      </div>
    </>
  );
}
