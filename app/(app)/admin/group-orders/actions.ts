"use server";

import { revalidatePath } from "next/cache";
import {
  setGroupOrdersStatus,
  deleteGroupOrders,
  departmentExportSummary,
  type GroupOrderStatus,
} from "@/lib/models/group-order";
import { requireAdminPermission } from "@/lib/admin-guard";

export async function setGroupOrdersStatusAction(ids: string[], status: GroupOrderStatus) {
  await requireAdminPermission("grouporders");
  await setGroupOrdersStatus(ids, status);
  revalidatePath("/admin/group-orders");
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
