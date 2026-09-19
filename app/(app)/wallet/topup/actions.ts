"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createTopupRequest } from "@/lib/models/topup-request";

export interface TopupState {
  error?: string;
}

export async function createTopupRequestAction(
  memberId: string,
  _prevState: TopupState,
  formData: FormData,
): Promise<TopupState> {
  const amount = Number(formData.get("amount"));
  const method = String(formData.get("method") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();

  try {
    await createTopupRequest({ memberId, amount, method, code: code || undefined, note: note || undefined });
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "發生錯誤，請稍後再試。" };
  }

  revalidatePath("/wallet");
  redirect("/wallet");
}
