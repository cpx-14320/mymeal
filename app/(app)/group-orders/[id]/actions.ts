"use server";

import { revalidatePath } from "next/cache";
import { replaceMemberLines, type RiceLevel } from "@/lib/models/group-order";

export interface SubmitOrderLineInput {
  itemId: string;
  itemName: string;
  price: number;
  qty: number;
  rice: RiceLevel;
  note?: string;
}

export interface SubmitOrderState {
  error?: string;
  success?: boolean;
}

export async function submitGroupOrderLinesAction(
  groupOrderId: string,
  memberId: string,
  memberName: string,
  lines: SubmitOrderLineInput[],
): Promise<SubmitOrderState> {
  try {
    await replaceMemberLines(groupOrderId, memberId, memberName, lines);
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "發生錯誤，請稍後再試。" };
  }
  revalidatePath(`/group-orders/${groupOrderId}`);
  return { success: true };
}
