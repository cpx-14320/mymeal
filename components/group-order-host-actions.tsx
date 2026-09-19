"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, inputClass } from "@/components/ui/primitives";
import type { GroupOrderStatus } from "@/lib/models/group-order";
import {
  closeGroupOrderAction,
  reopenGroupOrderAction,
  updateGroupOrderDeadlineAction,
} from "@/app/(app)/group-orders/[id]/actions";

/** "YYYY-MM-DD HH:mm"（後端存的格式）轉成 datetime-local 欄位要的 "YYYY-MM-DDTHH:mm"；格式對不上就回傳空字串。 */
function toDatetimeLocalValue(deadline: string): string {
  const m = deadline.match(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2})/);
  return m ? `${m[1]}T${m[2]}` : "";
}

/** 現在時間 +1 小時，給「重新開放」表單的預設截止時間。 */
function defaultReopenDeadline(): string {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function GroupOrderHostActions({
  groupOrderId,
  status,
  deadline,
}: {
  groupOrderId: string;
  status: GroupOrderStatus;
  deadline: string;
}) {
  const router = useRouter();
  const [editingDeadline, setEditingDeadline] = useState(false);
  const [reopening, setReopening] = useState(false);
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

  async function handleUpdateDeadline(formData: FormData) {
    setPending(true);
    setError(undefined);
    const value = String(formData.get("deadline") ?? "");
    const result = await updateGroupOrderDeadlineAction(groupOrderId, value);
    setPending(false);
    if (result.error) setError(result.error);
    else {
      setEditingDeadline(false);
      router.refresh();
    }
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

  if (status === "completed") return null;

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-danger">{error}</p>}

      {status === "open" && (
        <div className="flex flex-wrap items-center gap-2">
          {editingDeadline ? (
            <form
              action={handleUpdateDeadline}
              className="flex flex-wrap items-end gap-2"
            >
              <Field label="新的截止時間">
                <input
                  className={inputClass}
                  type="datetime-local"
                  name="deadline"
                  defaultValue={toDatetimeLocalValue(deadline)}
                  required
                />
              </Field>
              <Button type="button" variant="ghost" onClick={() => setEditingDeadline(false)}>
                取消
              </Button>
              <Button disabled={pending}>{pending ? "儲存中…" : "儲存"}</Button>
            </form>
          ) : (
            <>
              <Button variant="secondary" disabled={pending} onClick={() => setEditingDeadline(true)}>
                調整截止時間
              </Button>
              <Button variant="danger" disabled={pending} onClick={handleClose}>
                {pending ? "處理中…" : "提前結單"}
              </Button>
            </>
          )}
        </div>
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
  );
}
