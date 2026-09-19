"use server";

import { revalidatePath } from "next/cache";
import {
  replaceMemberLines,
  findGroupOrderById,
  setGroupOrderStatusAndDeadline,
  type RiceLevel,
} from "@/lib/models/group-order";
import { getSessionMemberId } from "@/lib/session";

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

export interface HostActionState {
  error?: string;
  success?: boolean;
}

/** 團主自己的權限檢查：不只前台藏按鈕，action 本身也要確認呼叫的人真的是這團的團主。 */
async function assertHost(groupOrderId: string) {
  const memberId = await getSessionMemberId();
  if (!memberId) throw new Error("請先登入。");
  const group = await findGroupOrderById(groupOrderId);
  if (!group) throw new Error("找不到這個團，可能已被刪除。");
  if (group.hostId !== memberId) throw new Error("只有團主可以進行這個操作。");
  return group;
}

/** 提前結單：開放中 → 已截止。 */
export async function closeGroupOrderAction(groupOrderId: string): Promise<HostActionState> {
  try {
    await assertHost(groupOrderId);
    await setGroupOrderStatusAndDeadline(groupOrderId, { status: "closed" });
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "發生錯誤，請稍後再試。" };
  }
  revalidatePath(`/group-orders/${groupOrderId}`);
  return { success: true };
}

/** 重新開放：已截止 → 開放中，同時把截止時間改成團主指定的新時間。 */
export async function reopenGroupOrderAction(
  groupOrderId: string,
  newDeadline: string,
): Promise<HostActionState> {
  try {
    await assertHost(groupOrderId);
    await setGroupOrderStatusAndDeadline(groupOrderId, {
      status: "open",
      deadline: newDeadline.trim().replace("T", " "),
    });
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "發生錯誤，請稍後再試。" };
  }
  revalidatePath(`/group-orders/${groupOrderId}`);
  return { success: true };
}

/** 開放中隨時調整截止時間，不影響狀態。 */
export async function updateGroupOrderDeadlineAction(
  groupOrderId: string,
  deadline: string,
): Promise<HostActionState> {
  try {
    await assertHost(groupOrderId);
    await setGroupOrderStatusAndDeadline(groupOrderId, { deadline: deadline.trim().replace("T", " ") });
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "發生錯誤，請稍後再試。" };
  }
  revalidatePath(`/group-orders/${groupOrderId}`);
  return { success: true };
}
