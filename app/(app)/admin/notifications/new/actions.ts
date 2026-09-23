"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createNotification, type NotificationInput } from "@/lib/models/notification";

export interface CreateNotificationState {
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

export async function createNotificationAction(
  _prevState: CreateNotificationState,
  formData: FormData,
): Promise<CreateNotificationState> {
  const input = parseInput(formData);
  if ("error" in input) return { error: input.error };

  let notificationId: string;
  try {
    const result = await createNotification(input);
    notificationId = result.id;
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "發生錯誤，請稍後再試。" };
  }

  revalidatePath("/admin/notifications");
  redirect(`/admin/notifications/${notificationId}`);
}
