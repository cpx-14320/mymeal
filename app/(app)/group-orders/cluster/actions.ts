"use server";

import { setMemberLinesPaid } from "@/lib/models/group-order";

/** 頁面本身已經是動態渲染（讀 session），呼叫端用 router.refresh() 重新抓資料即可，不需要 revalidatePath。 */
export async function setMemberPaidAction(groupOrderId: string, lineIds: string[], paid: boolean) {
  await setMemberLinesPaid(groupOrderId, lineIds, paid);
}
