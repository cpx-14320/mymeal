"use server";

import { revalidatePath } from "next/cache";
import { setNotificationsEnabled, deleteNotifications } from "@/lib/models/notification";

export async function setNotificationsEnabledAction(ids: string[], enabled: boolean) {
  await setNotificationsEnabled(ids, enabled);
  revalidatePath("/admin/promos");
}

export async function deleteNotificationsAction(ids: string[]) {
  await deleteNotifications(ids);
  revalidatePath("/admin/promos");
}
