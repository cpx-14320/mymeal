"use server";

import { revalidatePath } from "next/cache";
import { updateOrderZone, type OrderZoneInput } from "@/lib/models/order-zone";

export interface UpdateZoneState {
  error?: string;
  success?: boolean;
}

function parseInput(formData: FormData): OrderZoneInput | { error: string } {
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const icon = String(formData.get("icon") ?? "").trim();
  const sortOrder = Number(formData.get("sortOrder") ?? 0);
  const templateIds = formData.getAll("templateIds").map(String);
  const active = formData.get("active") === "on";

  if (!name || !slug) return { error: "請填寫專區名稱與代稱。" };
  if (!Number.isFinite(sortOrder)) return { error: "排序請輸入數字。" };

  return { name, slug, description, icon, sortOrder, templateIds, active };
}

export async function updateZoneAction(
  id: string,
  _prevState: UpdateZoneState,
  formData: FormData,
): Promise<UpdateZoneState> {
  const input = parseInput(formData);
  if ("error" in input) return { error: input.error };

  try {
    await updateOrderZone(id, input);
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "發生錯誤，請稍後再試。" };
  }

  revalidatePath("/admin/zones");
  revalidatePath(`/admin/zones/${id}`);
  return { success: true };
}
