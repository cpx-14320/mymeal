"use server";

import { revalidatePath } from "next/cache";
import {
  createGroupOrder,
  setGroupOrdersStatus,
  deleteGroupOrders,
  departmentExportSummary,
  type CreateGroupOrderInput,
  type GroupOrderStatus,
} from "@/lib/models/group-order";

export interface CreateGroupOrderState {
  error?: string;
  success?: boolean;
}

export async function createGroupOrderAction(
  _prevState: CreateGroupOrderState,
  formData: FormData,
): Promise<CreateGroupOrderState> {
  const input: CreateGroupOrderInput = {
    name: String(formData.get("name") ?? "").trim(),
    templateId: String(formData.get("templateId") ?? ""),
    unitId: String(formData.get("unitId") ?? ""),
    hostId: String(formData.get("hostId") ?? ""),
    date: String(formData.get("date") ?? "").trim().replaceAll("-", "/"),
    deadline: String(formData.get("deadline") ?? "").trim(),
  };

  try {
    await createGroupOrder(input);
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "發生錯誤，請稍後再試。" };
  }

  revalidatePath("/admin/group-orders");
  return { success: true };
}

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
