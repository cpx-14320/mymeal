"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, inputClass } from "@/components/ui/primitives";
import type { GroupOrderStatus, WalletChargeShortfall } from "@/lib/models/group-order";
import {
  closeGroupOrderAction,
  reopenGroupOrderAction,
  cancelGroupOrderAction,
  previewCloseShortfallsAction,
} from "@/app/(app)/group-orders/[id]/actions";

/** 現在時間 +1 小時，給「重新開放」表單的預設截止時間。 */
function defaultReopenDeadline(): string {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function GroupOrderHostActions({
  groupOrderId,
  status,
  trailingActions,
}: {
  groupOrderId: string;
  status: GroupOrderStatus;
  /** 跟團主操作（提前結單／取消團訂…）放在同一列的其他按鈕，例如返回列表、匯出 CSV。 */
  trailingActions?: ReactNode;
}) {
  const router = useRouter();
  const [reopening, setReopening] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [shortfalls, setShortfalls] = useState<WalletChargeShortfall[] | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function handleClose() {
    setPending(true);
    setError(undefined);
    const result = await closeGroupOrderAction(groupOrderId);
    setPending(false);
    if (result.error) setError(result.error);
    else {
      setShortfalls(null);
      router.refresh();
    }
  }

  /** 按「提前結單」先跑這個：沒有人會扣成負的就直接結單，有的話先跳出清單讓團主確認。 */
  async function handleCloseClick() {
    setPending(true);
    setError(undefined);
    const found = await previewCloseShortfallsAction(groupOrderId);
    setPending(false);
    if (found.length === 0) {
      await handleClose();
      return;
    }
    setShortfalls(found);
  }

  async function handleReopen(formData: FormData) {
    setPending(true);
    setError(undefined);
    const value = String(formData.get("deadline") ?? "");
    const result = await reopenGroupOrderAction(groupOrderId, value);
    setPending(false);
    if (result.error) setError(result.error);
    else {
      setReopening(false);
      router.refresh();
    }
  }

  async function handleCancel() {
    setPending(true);
    setError(undefined);
    const result = await cancelGroupOrderAction(groupOrderId);
    setPending(false);
    if (result.error) setError(result.error);
    else router.push("/group-orders");
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-danger">{error}</p>}

      {shortfalls && shortfalls.length > 0 && (
        <div className="space-y-2 rounded-lg border border-danger/40 bg-danger/5 p-3">
          <p className="text-sm font-medium text-danger">
            結單後以下 {shortfalls.length} 人錢包餘額會變成負的，確定要繼續結單嗎？
          </p>
          <ul className="space-y-0.5 text-sm text-muted">
            {shortfalls.map((s) => (
              <li key={s.memberId}>
                {s.memberName}：NT$ {s.currentBalance} → <span className="font-medium text-danger">NT$ {s.balanceAfter}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" disabled={pending} onClick={() => setShortfalls(null)}>
              取消
            </Button>
            <Button variant="danger" disabled={pending} onClick={handleClose}>
              {pending ? "處理中…" : "確認結單"}
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2">
        {trailingActions}

        {confirmingCancel ? (
          <>
            <p className="text-sm text-danger">
              確定要取消團訂嗎？大家目前點的餐點都會一併刪除，已經扣款的部分會退回錢包，此動作無法復原。
            </p>
            <Button type="button" variant="ghost" disabled={pending} onClick={() => setConfirmingCancel(false)}>
              返回
            </Button>
            <Button variant="danger" disabled={pending} onClick={handleCancel}>
              {pending ? "取消中…" : "確認取消團訂"}
            </Button>
          </>
        ) : (
          <Button variant="danger" disabled={pending} onClick={() => setConfirmingCancel(true)}>
            取消團訂
          </Button>
        )}

        {status === "open" && !(shortfalls && shortfalls.length > 0) && (
          <Button variant="danger" disabled={pending} onClick={handleCloseClick}>
            {pending ? "處理中…" : "提前結單"}
          </Button>
        )}

        {status === "closed" &&
          (reopening ? (
            <form action={handleReopen} className="flex flex-wrap items-end gap-2">
              <Field label="新的截止時間" hint="預設現在時間 +1 小時，可手動調整">
                <input
                  className={inputClass}
                  type="datetime-local"
                  name="deadline"
                  defaultValue={defaultReopenDeadline()}
                  required
                />
              </Field>
              <Button type="button" variant="ghost" onClick={() => setReopening(false)}>
                取消
              </Button>
              <Button disabled={pending}>{pending ? "處理中…" : "確認重新開放"}</Button>
            </form>
          ) : (
            <Button disabled={pending} onClick={() => setReopening(true)}>
              重新開放
            </Button>
          ))}
      </div>
    </div>
  );
}
