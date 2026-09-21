"use server";

import { revalidatePath } from "next/cache";
import { adjustMemberBalance } from "@/lib/models/wallet";
import { findMemberById } from "@/lib/models/member";
import { createAuditLog } from "@/lib/models/audit-log";
import { getCurrentActorName } from "@/lib/session";

export interface AdjustBalanceState {
  error?: string;
  success?: boolean;
}

export async function adjustBalanceAction(
  memberId: string,
  amount: number,
  note: string,
): Promise<AdjustBalanceState> {
  const actor = await getCurrentActorName();
  try {
    await adjustMemberBalance(memberId, amount, note, actor);
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "發生錯誤，請稍後再試。" };
  }

  const member = await findMemberById(memberId);
  await createAuditLog({
    actor,
    action: `手動調整餘額（${amount > 0 ? "+" : ""}${amount}）：${note}`,
    target: member?.name ?? memberId,
    risk: true,
  });

  revalidatePath("/admin/wallets");
  revalidatePath("/admin/topups");
  revalidatePath("/admin/audit");
  return { success: true };
}
