"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createGroupOrder } from "@/lib/models/group-order";

export interface OpenGroupOrderState {
  error?: string;
}

export async function openGroupOrderAction(
  hostId: string,
  _prevState: OpenGroupOrderState,
  formData: FormData,
): Promise<OpenGroupOrderState> {
  const name = String(formData.get("name") ?? "").trim();
  const templateId = String(formData.get("templateId") ?? "");
  const sectionId = String(formData.get("sectionId") ?? "").trim();
  const unitId = String(formData.get("unitId") ?? "");
  const date = String(formData.get("date") ?? "").trim().replaceAll("-", "/");
  const deadline = String(formData.get("deadline") ?? "").trim().replace("T", " ");

  let groupOrderId: string;
  try {
    const result = await createGroupOrder({ name, templateId, sectionId, unitId, hostId, date, deadline });
    groupOrderId = result.id;
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "發生錯誤，請稍後再試。" };
  }

  revalidatePath("/group-orders");
  redirect(`/group-orders/${groupOrderId}`);
}
