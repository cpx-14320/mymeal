"use server";

import { listEnabledNotifications } from "@/lib/models/notification";

/** 前台通知鈴鐺用：只回傳「開啟」的通知。 */
export async function getEnabledNotificationsAction() {
  return listEnabledNotifications();
}
