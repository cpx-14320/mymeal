"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, inputClass, STAT_CARD_CLASS, COMPACT_STAT_VALUE_CLASS } from "@/components/ui/primitives";
import { updateGroupOrderDeadlineAction } from "@/app/(app)/group-orders/[id]/actions";

/** "YYYY-MM-DD HH:mm"（後端存的格式）轉成 datetime-local 欄位要的 "YYYY-MM-DDTHH:mm"；格式對不上就回傳空字串。 */
function toDatetimeLocalValue(deadline: string): string {
  const m = deadline.match(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2})/);
  return m ? `${m[1]}T${m[2]}` : "";
}

/** 頁面頂端「截止時間」那張 Stat 卡片的可編輯版本——調整截止時間直接在這張卡片內完成，
 *  不再是動作列上獨立的按鈕，看時間跟調時間放在同一個地方。只有團主、且團訂還開放中才能編輯。 */
export function GroupOrderDeadlineStat({
  groupOrderId,
  deadline,
  editable,
}: {
  groupOrderId: string;
  deadline: string;
  editable: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function handleUpdate(formData: FormData) {
    setPending(true);
    setError(undefined);
    const value = String(formData.get("deadline") ?? "");
    const result = await updateGroupOrderDeadlineAction(groupOrderId, value);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setEditing(false);
    router.refresh();
  }

  return (
    <div className={STAT_CARD_CLASS}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted">截止時間</p>
        {editable && !editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-muted hover:text-brand"
            aria-label="調整截止時間"
          >
            ✎
          </button>
        )}
      </div>

      {editing ? (
        <form action={handleUpdate} className="mt-1 space-y-2">
          <input
            className={`${inputClass} text-sm`}
            type="datetime-local"
            name="deadline"
            defaultValue={toDatetimeLocalValue(deadline)}
            required
          />
          {error && <p className="text-xs text-danger">{error}</p>}
          <div className="flex gap-2">
            <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={() => setEditing(false)}>
              取消
            </Button>
            <Button size="sm" disabled={pending}>
              {pending ? "儲存中…" : "儲存"}
            </Button>
          </div>
        </form>
      ) : (
        <p className={`mt-1 font-bold tracking-tight tabular-nums ${COMPACT_STAT_VALUE_CLASS}`}>
          {deadline || "—"}
        </p>
      )}
    </div>
  );
}
