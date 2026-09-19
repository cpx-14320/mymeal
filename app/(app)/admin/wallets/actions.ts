"use server";

import { revalidatePath } from "next/cache";
import { adjustMemberBalance } from "@/lib/models/wallet";

export interface AdjustBalanceState {
  error?: string;
  success?: boolean;
}

export async function adjustBalanceAction(
  memberId: string,
  amount: number,
  note: string,
): Promise<AdjustBalanceState> {
  try {
    await adjustMemberBalance(memberId, amount, note);
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "發生錯誤，請稍後再試。" };
  }
  revalidatePath("/admin/wallets");
  revalidatePath("/admin/topups");
  return { success: true };
}
