import { getSessionMemberId } from "@/lib/session";
import { getMemberPermissions } from "@/lib/models/role";
import type { AdminNavKey } from "@/components/layout/nav";

/** 後台權限不足時丟出——跟一般的 Error 分開，方便呼叫端（如果想）辨識這是「權限」失敗，
 *  不是其他業務邏輯錯誤。 */
export class AdminPermissionError extends Error {
  constructor(message = "你沒有這項功能的權限。") {
    super(message);
    this.name = "AdminPermissionError";
  }
}

/**
 * 後台 server action 專用的權限守門——每個會改資料的 action 開頭呼叫，沒有對應權限就直接
 * 丟錯，中斷整個 action，不會執行到底下真正動資料庫的程式碼。
 * 跟 admin/layout.tsx 的頁面層權限檢查是兩層獨立防護：layout 擋的是「打開頁面」，
 * 這支擋的是「送出動作」——沒有這層的話，就算頁面進不去，只要知道 action 的呼叫方式，
 * 還是可能繞過畫面直接觸發動作；兩層都要過，才算真的擋住。
 */
export async function requireAdminPermission(key: AdminNavKey): Promise<void> {
  const memberId = await getSessionMemberId();
  if (!memberId) throw new AdminPermissionError("請先登入。");
  const permissions = await getMemberPermissions(memberId);
  if (!permissions[key]) throw new AdminPermissionError();
}
