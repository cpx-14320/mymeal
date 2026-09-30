"use server";

import { setMemberLinesPaid } from "@/lib/models/group-order";
import { assertHost } from "@/app/(app)/group-orders/[id]/actions";

/** 頁面本身已經是動態渲染（讀 session），呼叫端用 router.refresh() 重新抓資料即可，不需要 revalidatePath。
 *  付款狀態只有那個單位的團主能改，跟結單/取消團訂一樣的權限層級——不只前端隱藏按鈕，
 *  這裡也要重新驗證，防止繞過前端直接呼叫。 */
export async function setMemberPaidAction(groupOrderId: string, lineIds: string[], paid: boolean) {
  await assertHost(groupOrderId);
  await setMemberLinesPaid(groupOrderId, lineIds, paid);
}
