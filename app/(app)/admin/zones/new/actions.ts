"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createOrderZone, type OrderZoneInput } from "@/lib/models/order-zone";

export interface CreateZoneState {
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

export async function createZoneAction(
  _prevState: CreateZoneState,
  formData: FormData,
): Promise<CreateZoneState> {
  const input = parseInput(formData);
  if ("error" in input) return { error: input.error };

  let zoneId: string;
  try {
    const result = await createOrderZone(input);
    zoneId = result.id;
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "發生錯誤，請稍後再試。" };
  }

  revalidatePath("/admin/zones");
  redirect(`/admin/zones/${zoneId}`);
}
