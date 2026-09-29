"use server";

import { revalidatePath } from "next/cache";
import { setNotificationsEnabled, deleteNotifications } from "@/lib/models/notification";
import { requireAdminPermission } from "@/lib/admin-guard";

export async function setNotificationsEnabledAction(ids: string[], enabled: boolean) {
  await requireAdminPermission("promos");
  await setNotificationsEnabled(ids, enabled);
  revalidatePath("/admin/promos");
}

export async function deleteNotificationsAction(ids: string[]) {
  await requireAdminPermission("promos");
  await deleteNotifications(ids);
  revalidatePath("/admin/promos");
}
