"use server";

import { revalidatePath } from "next/cache";
import {
  replaceMemberLines,
  findGroupOrderById,
  setGroupOrderStatusAndDeadline,
  chargeWalletForGroupOrder,
  refundWalletForGroupOrder,
  cancelMemberLine,
  deleteGroupOrders,
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
  paymentMethod?: string;
  bankCode?: string;
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

/** 「我的訂單」頁取消單一筆用：只能取消自己的訂單，不用團主權限。 */
export async function cancelMemberLineAction(
  groupOrderId: string,
  lineId: string,
): Promise<SubmitOrderState> {
  const memberId = await getSessionMemberId();
  if (!memberId) return { error: "請先登入。" };
  try {
    await cancelMemberLine(groupOrderId, memberId, lineId);
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "發生錯誤，請稍後再試。" };
  }
  revalidatePath("/orders");
  revalidatePath(`/group-orders/${groupOrderId}`);
  revalidatePath("/wallet");
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

/** 提前結單：開放中 → 已截止，同時把選「錢包扣款」的人實際扣款。 */
export async function closeGroupOrderAction(groupOrderId: string): Promise<HostActionState> {
  try {
    await assertHost(groupOrderId);
    await setGroupOrderStatusAndDeadline(groupOrderId, { status: "closed" });
    await chargeWalletForGroupOrder(groupOrderId);
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "發生錯誤，請稍後再試。" };
  }
  revalidatePath(`/group-orders/${groupOrderId}`);
  revalidatePath("/wallet");
  return { success: true };
}

/** 重新開放：已截止 → 開放中，同時把截止時間改成團主指定的新時間，
 *  並把已經扣過的錢包款全部退回——避免會員在開放期間改訂單後，下次結單被重複扣款。 */
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
    await refundWalletForGroupOrder(groupOrderId);
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "發生錯誤，請稍後再試。" };
  }
  revalidatePath(`/group-orders/${groupOrderId}`);
  revalidatePath("/wallet");
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

/** 取消整團：直接刪除這筆團訂（含所有人已點的品項），只有團主能操作；刪除後前端要導回列表頁。 */
export async function cancelGroupOrderAction(groupOrderId: string): Promise<HostActionState> {
  try {
    await assertHost(groupOrderId);
    await deleteGroupOrders([groupOrderId]);
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "發生錯誤，請稍後再試。" };
  }
  revalidatePath("/group-orders");
  return { success: true };
}
