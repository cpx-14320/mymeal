"use server";

import { revalidatePath } from "next/cache";
import { updateNotification, deleteNotification, type NotificationInput } from "@/lib/models/notification";

export interface UpdateNotificationState {
  error?: string;
  success?: boolean;
}

function parseInput(formData: FormData): NotificationInput | { error: string } {
  const title = String(formData.get("title") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const linkUrl = String(formData.get("linkUrl") ?? "").trim();
  const enabled = formData.get("enabled") === "on";

  if (!title) return { error: "請填寫標題。" };
  if (!message) return { error: "請填寫訊息內容。" };

  return { title, message, linkUrl, enabled };
}

export async function updateNotificationAction(
  id: string,
  _prevState: UpdateNotificationState,
  formData: FormData,
): Promise<UpdateNotificationState> {
  const input = parseInput(formData);
  if ("error" in input) return { error: input.error };

  try {
    await updateNotification(id, input);
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "發生錯誤，請稍後再試。" };
  }

  revalidatePath("/admin/notifications");
  revalidatePath(`/admin/notifications/${id}`);
  return { success: true };
}

export interface DeleteNotificationState {
  error?: string;
  success?: boolean;
}

export async function deleteNotificationAction(id: string): Promise<DeleteNotificationState> {
  const deleted = await deleteNotification(id);
  if (!deleted) return { error: "找不到這則通知，可能已被刪除。" };

  revalidatePath("/admin/notifications");
  return { success: true };
}
