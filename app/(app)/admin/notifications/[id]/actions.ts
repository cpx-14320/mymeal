"use server";

import { revalidatePath } from "next/cache";
import { updateNotification, type NotificationInput } from "@/lib/models/notification";

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

  revalidatePath("/admin/promos");
  revalidatePath(`/admin/notifications/${id}`);
  return { success: true };
}
