"use server";

import { revalidatePath } from "next/cache";
import {
  setGroupOrdersStatus,
  deleteGroupOrders,
  departmentExportSummary,
  type GroupOrderStatus,
} from "@/lib/models/group-order";

export async function setGroupOrdersStatusAction(ids: string[], status: GroupOrderStatus) {
  await setGroupOrdersStatus(ids, status);
  revalidatePath("/admin/group-orders");
}

export async function deleteGroupOrdersAction(ids: string[]) {
  await deleteGroupOrders(ids);
  revalidatePath("/admin/group-orders");
}

export async function getDepartmentExportSummaryAction(departmentId: string) {
  return departmentExportSummary(departmentId);
}
