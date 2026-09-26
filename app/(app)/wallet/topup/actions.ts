"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createTopupRequest, deleteOwnPendingTopupRequest } from "@/lib/models/topup-request";
import { getSessionMemberId } from "@/lib/session";

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

/** 「待審核」列表的刪除按鈕用：申請人自己撤回還沒審核的申請。 */
export async function deleteMyTopupRequestAction(requestId: string): Promise<TopupState> {
  const memberId = await getSessionMemberId();
  if (!memberId) return { error: "請先登入。" };

  try {
    await deleteOwnPendingTopupRequest(memberId, requestId);
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "發生錯誤，請稍後再試。" };
  }

  revalidatePath("/wallet");
  return {};
}
