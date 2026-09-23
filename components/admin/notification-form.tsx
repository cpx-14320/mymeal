"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, Field, inputClass, Note, Button, ButtonLink } from "@/components/ui/primitives";
import type { NotificationView } from "@/lib/models/notification";
import { createNotificationAction, type CreateNotificationState } from "@/app/(app)/admin/notifications/new/actions";
import {
  updateNotificationAction,
  deleteNotificationAction,
  type UpdateNotificationState,
} from "@/app/(app)/admin/notifications/[id]/actions";

/** 新增 / 編輯通知訊息共用的表單。傳 notification 就是編輯模式（欄位帶入現值＋多一個刪除按鈕）。 */
export function NotificationForm({ notification }: { notification?: NotificationView }) {
  const router = useRouter();
  const isEdit = !!notification;
  const action = isEdit ? updateNotificationAction.bind(null, notification.id) : createNotificationAction;
  const [state, formAction, pending] = useActionState<CreateNotificationState | UpdateNotificationState, FormData>(
    action,
    {},
  );
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | undefined>();

  useEffect(() => {
    if (isEdit && state.success) router.refresh();
  }, [isEdit, state.success, router]);

  async function handleDelete() {
    if (!notification) return;
    setDeleting(true);
    setDeleteError(undefined);
    const result = await deleteNotificationAction(notification.id);
    if (result.error) {
      setDeleteError(result.error);
      setDeleting(false);
      return;
    }
    router.push("/admin/notifications");
    router.refresh();
  }

  return (
    <form action={formAction}>
      <Card>
        <CardBody className="space-y-5">
          <Field label="標題" hint="顯示在通知清單裡的第一行">
            <input
              className={inputClass}
              name="title"
              defaultValue={notification?.title}
              placeholder="例：新品項上架：舒肥雞胸餐盒"
              required
            />
          </Field>

          <Field label="訊息內容">
            <textarea
              className={inputClass}
              name="message"
              rows={3}
              defaultValue={notification?.message}
              placeholder="通知的詳細內容"
              required
            />
          </Field>

          <Field label="點擊前往（連結網址）" hint="留空＝不可點">
            <input
              className={inputClass}
              name="linkUrl"
              defaultValue={notification?.linkUrl}
              placeholder="/menu 或 https://…"
            />
          </Field>

          <div>
            <span className="mb-1.5 block text-sm font-medium">狀態</span>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="enabled" defaultChecked={notification?.enabled ?? true} />
              開啟（顯示於前台通知鈴鐺清單）
            </label>
          </div>

          <Note>沒有排程時間窗，開啟就會立刻出現在前台通知清單、關閉就會立刻移除。</Note>

          {state.error && <p className="text-[13px] lg:text-[14px] text-danger">{state.error}</p>}
        </CardBody>
      </Card>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        {isEdit ? (
          <div className="flex items-center gap-3">
            <Button type="button" variant="danger" disabled={deleting} onClick={handleDelete}>
              {deleting ? "刪除中…" : "刪除通知"}
            </Button>
            {deleteError && <p className="text-[13px] lg:text-[14px] text-danger">{deleteError}</p>}
          </div>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <ButtonLink href="/admin/notifications" variant="ghost">
            {isEdit ? "返回列表" : "取消"}
          </ButtonLink>
          <Button disabled={pending}>{pending ? "儲存中…" : isEdit ? "儲存" : "建立通知"}</Button>
        </div>
      </div>
    </form>
  );
}
