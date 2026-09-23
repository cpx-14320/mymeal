"use server";

import { revalidatePath } from "next/cache";
import {
  approveTopupRequest,
  rejectTopupRequest,
  deleteTopupRequest,
  listTopupRequests,
} from "@/lib/models/topup-request";
import { createAuditLog } from "@/lib/models/audit-log";
import { getCurrentActorName } from "@/lib/session";

export interface TopupActionState {
  error?: string;
  success?: boolean;
}

async function findRequestLabel(id: string): Promise<string> {
  const requests = await listTopupRequests();
  const req = requests.find((r) => r.id === id);
  return req ? `${req.memberName}．NT$ ${req.amount}` : id;
}

export async function approveTopupAction(id: string): Promise<TopupActionState> {
  const actor = await getCurrentActorName();
  const label = await findRequestLabel(id);
  try {
    await approveTopupRequest(id, actor);
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "發生錯誤，請稍後再試。" };
  }

  await createAuditLog({ actor, action: "核准儲值申請", target: label });

  revalidatePath("/admin/topups");
  revalidatePath("/admin/wallets");
  revalidatePath("/admin");
  revalidatePath("/admin/audit");
  return { success: true };
}

export async function rejectTopupAction(id: string, reviewNote?: string): Promise<TopupActionState> {
  const actor = await getCurrentActorName();
  const label = await findRequestLabel(id);
  try {
    await rejectTopupRequest(id, reviewNote, actor);
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "發生錯誤，請稍後再試。" };
  }

  await createAuditLog({ actor, action: "退件儲值申請", target: label });

  revalidatePath("/admin/topups");
  revalidatePath("/admin");
  revalidatePath("/admin/audit");
  return { success: true };
}

export async function deleteTopupAction(id: string): Promise<TopupActionState> {
  try {
    await deleteTopupRequest(id);
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "發生錯誤，請稍後再試。" };
  }
  revalidatePath("/admin/topups");
  revalidatePath("/admin");
  return { success: true };
}

/** 批次版本：逐筆呼叫既有的單筆 action（沿用同一套稽核紀錄／餘額入帳邏輯），
 *  失敗的筆數收集起來回報，不會因為其中一筆失敗就整批中斷。 */
async function runBulk(ids: string[], run: (id: string) => Promise<TopupActionState>, verb: string) {
  let failCount = 0;
  let firstError: string | undefined;
  for (const id of ids) {
    const result = await run(id);
    if (result.error) {
      failCount++;
      firstError ??= result.error;
    }
  }
  if (failCount > 0) return { error: `${failCount} 筆${verb}失敗：${firstError}` };
  return { success: true };
}

export async function bulkApproveTopupsAction(ids: string[]): Promise<TopupActionState> {
  return runBulk(ids, approveTopupAction, "核准");
}

export async function bulkRejectTopupsAction(ids: string[]): Promise<TopupActionState> {
  return runBulk(ids, (id) => rejectTopupAction(id), "退件");
}

export async function bulkDeleteTopupsAction(ids: string[]): Promise<TopupActionState> {
  return runBulk(ids, deleteTopupAction, "刪除");
}
