"use server";

import { revalidatePath } from "next/cache";
import { updateInterstitial, deleteInterstitial, type InterstitialInput, type PromoFrequency } from "@/lib/models/interstitial";

export interface UpdatePromoState {
  error?: string;
  success?: boolean;
}

function parseInput(formData: FormData): InterstitialInput | { error: string } {
  const name = String(formData.get("name") ?? "").trim();
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  const linkUrl = String(formData.get("linkUrl") ?? "").trim();
  const dismissSeconds = Number(formData.get("dismissSeconds") ?? 0);
  const frequency = String(formData.get("frequency") ?? "daily") as PromoFrequency;
  const startAt = String(formData.get("startAt") ?? "").trim();
  const endAt = String(formData.get("endAt") ?? "").trim();
  const enabled = formData.get("enabled") === "on";

  if (!name) return { error: "請填寫活動名稱。" };
  if (!startAt || !endAt) return { error: "請設定排程開始與結束時間。" };
  if (!Number.isFinite(dismissSeconds) || dismissSeconds < 0) return { error: "倒數秒數請輸入 0 以上的數字。" };

  return { name, imageUrl, linkUrl, dismissSeconds, frequency, startAt, endAt, enabled };
}

export async function updatePromoAction(
  id: string,
  _prevState: UpdatePromoState,
  formData: FormData,
): Promise<UpdatePromoState> {
  const input = parseInput(formData);
  if ("error" in input) return { error: input.error };

  try {
    await updateInterstitial(id, input);
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "發生錯誤，請稍後再試。" };
  }

  revalidatePath("/admin/promos");
  revalidatePath(`/admin/promos/${id}`);
  return { success: true };
}

export interface DeletePromoState {
  error?: string;
  success?: boolean;
}

export async function deletePromoAction(id: string): Promise<DeletePromoState> {
  const deleted = await deleteInterstitial(id);
  if (!deleted) return { error: "找不到這個廣告，可能已被刪除。" };

  revalidatePath("/admin/promos");
  return { success: true };
}
