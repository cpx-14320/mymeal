"use server";

import { revalidatePath } from "next/cache";
import {
  closeGroupOrders,
  reopenGroupOrders,
  deleteGroupOrders,
  departmentExportSummary,
  type GroupOrderStatus,
} from "@/lib/models/group-order";
import { requireAdminPermission } from "@/lib/admin-guard";

/** 「截止選取」／「開放選取」分別跟前台團主的「提前結單」／「重新開放」共用
 *  closeGroupOrders／reopenGroupOrders（會真的扣款／退款，見那兩支函式說明）——
 *  差別只在授權：前台用 assertHost 限定本人的團，後台用 requireAdminPermission。
 *  「開放選取」沒有逐團輸入新截止時間的介面，交給 reopenGroupOrders 自己套用
 *  「現在+1小時」的預設值。 */
export async function setGroupOrdersStatusAction(ids: string[], status: GroupOrderStatus) {
  await requireAdminPermission("grouporders");
  if (status === "closed") {
    await closeGroupOrders(ids);
  } else {
    await reopenGroupOrders(ids);
  }
  revalidatePath("/admin/group-orders");
  revalidatePath("/wallet");
}

export async function deleteGroupOrdersAction(ids: string[]) {
  await requireAdminPermission("grouporders");
  await deleteGroupOrders(ids);
  revalidatePath("/admin/group-orders");
}

export async function getDepartmentExportSummaryAction(departmentId: string) {
  await requireAdminPermission("grouporders");
  return departmentExportSummary(departmentId);
}
