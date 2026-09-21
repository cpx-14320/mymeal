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
