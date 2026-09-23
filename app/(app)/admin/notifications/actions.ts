"use server";

import { revalidatePath } from "next/cache";
import { setNotificationsEnabled } from "@/lib/models/notification";

export async function setNotificationsEnabledAction(ids: string[], enabled: boolean) {
  await setNotificationsEnabled(ids, enabled);
  revalidatePath("/admin/notifications");
}
