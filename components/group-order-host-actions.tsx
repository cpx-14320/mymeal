"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, inputClass } from "@/components/ui/primitives";
import type { GroupOrderStatus } from "@/lib/models/group-order";
import {
  closeGroupOrderAction,
  reopenGroupOrderAction,
  cancelGroupOrderAction,
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
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function handleClose() {
    setPending(true);
    setError(undefined);
    const result = await closeGroupOrderAction(groupOrderId);
    setPending(false);
    if (result.error) setError(result.error);
    else router.refresh();
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

  if (status === "completed") {
    return trailingActions ? (
      <div className="flex flex-wrap items-center justify-end gap-2">{trailingActions}</div>
    ) : null;
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex flex-wrap items-center justify-end gap-2">
        {trailingActions}

        {confirmingCancel ? (
          <>
            <p className="text-sm text-danger">確定要取消團訂嗎？大家目前點的餐點都會一併刪除，無法復原。</p>
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

        {status === "open" && (
          <Button variant="danger" disabled={pending} onClick={handleClose}>
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
