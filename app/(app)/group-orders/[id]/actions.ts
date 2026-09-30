"use server";

import { revalidatePath } from "next/cache";
import {
  replaceMemberLines,
  findGroupOrderById,
  setGroupOrderStatusAndDeadline,
  updateGroupOrderSettings,
  chargeWalletForGroupOrder,
  refundWalletForGroupOrder,
  cancelMemberLine,
  deleteGroupOrders,
  previewWalletChargeShortfalls,
  type RiceLevel,
  type WalletChargeShortfall,
} from "@/lib/models/group-order";
import { getSessionMemberId } from "@/lib/session";
import { findMemberById } from "@/lib/models/member";

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

/** 送出「自己」在這團要點的餐——身分一律從 session 判斷，不採信前端傳來的 memberId／
 *  memberName，避免有人竄改參數去改到別人的訂單。品項的實際售價也是在 replaceMemberLines
 *  裡從模板重新查，不採信前端送來的 price，防止竄改金額。 */
export async function submitGroupOrderLinesAction(
  groupOrderId: string,
  lines: SubmitOrderLineInput[],
): Promise<SubmitOrderState> {
  const memberId = await getSessionMemberId();
  if (!memberId) return { error: "請先登入。" };
  const member = await findMemberById(memberId);
  if (!member) return { error: "請先登入。" };
  try {
    await replaceMemberLines(groupOrderId, memberId, member.name, lines);
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

/** 團主自己的權限檢查：不只前台藏按鈕，action 本身也要確認呼叫的人真的是這團的團主。
 *  匯出給 group-orders/cluster/actions.ts 共用（付款狀態切換也是團主專屬操作）。 */
export async function assertHost(groupOrderId: string) {
  const memberId = await getSessionMemberId();
  if (!memberId) throw new Error("請先登入。");
  const group = await findGroupOrderById(groupOrderId);
  if (!group) throw new Error("找不到這個團，可能已被刪除。");
  if (group.hostId !== memberId) throw new Error("只有團主可以進行這個操作。");
  return group;
}

/** 結單前用：給團主看有沒有人結單後錢包會變負的，讓團主自己決定要不要繼續。 */
export async function previewCloseShortfallsAction(groupOrderId: string): Promise<WalletChargeShortfall[]> {
  await assertHost(groupOrderId);
  return previewWalletChargeShortfalls(groupOrderId);
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

export interface UpdateGroupOrderSettingsState {
  error?: string;
  success?: boolean;
}

/** 團主修正開團時設錯的模板／區塊／單位／團名／截止時間用；模板／區塊／單位／團名
 *  不影響大家已經點好的品項（見 lib/models/group-order 的 updateGroupOrderSettings
 *  說明）。截止時間原本是獨立一支 action（updateGroupOrderDeadlineAction）在改，
 *  現在併進這支一起送出，後台只留「編輯團訂設定」這一個彈窗。 */
export async function updateGroupOrderSettingsAction(
  groupOrderId: string,
  input: { name: string; templateId: string; sectionId?: string; unitId: string; deadline: string },
): Promise<UpdateGroupOrderSettingsState> {
  try {
    await assertHost(groupOrderId);
    await updateGroupOrderSettings(groupOrderId, input);
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "發生錯誤，請稍後再試。" };
  }
  revalidatePath(`/group-orders/${groupOrderId}`);
  revalidatePath("/group-orders");
  return { success: true };
}

/** 取消整團：已經扣過錢包款的行先全部退款，再刪除這筆團訂（含所有人已點的品項），
 *  只有團主能操作；刪除後前端要導回列表頁。團主取消自己開的團是正常操作，不算高風險的
 *  管理行為，不寫稽核紀錄（跟後台管理員的操作分開看）。 */
export async function cancelGroupOrderAction(groupOrderId: string): Promise<HostActionState> {
  try {
    await assertHost(groupOrderId);
    await refundWalletForGroupOrder(groupOrderId);
    await deleteGroupOrders([groupOrderId]);
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "發生錯誤，請稍後再試。" };
  }
  revalidatePath("/group-orders");
  revalidatePath("/wallet");
  return { success: true };
}
