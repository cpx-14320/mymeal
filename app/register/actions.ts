"use server";

import { createMember, parseMemberForm } from "@/lib/models/member";
import { createSession } from "@/lib/session";

export interface RegisterState {
  error?: string;
  success?: boolean;
  memberCode?: string;
}

/**
 * 邀請碼欄位是一碼兩用：
 * 1. 填對這組固定碼（存在 .env.local 的 ADMIN_INVITE_CODE）→ 註冊帳號直接開超級管理員（所有權限全開）。
 * 2. 填的是某位現有會員的專屬碼（memberCode）→ 當推薦碼，記下推薦人，權限不受影響。
 * 兩種都沒對到就當沒填，照常註冊一般使用者，不擋註冊流程。
 * 共用的必填/密碼/部門單位/推薦碼解析見 parseMemberForm；這裡只處理前台獨有的
 * 「邀請碼也能換管理員角色」邏輯（後台新增會員本來就有「權限」欄位可選，不需要這個後門）。
 */
const ADMIN_ROLE_NAME = "超級管理員";

export async function registerAction(
  _prevState: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const parsed = await parseMemberForm(formData);
  if (!parsed.ok) return { error: parsed.error };
  const fields = parsed.fields;

  const isAdminInvite = fields.inviteCode && fields.inviteCode === process.env.ADMIN_INVITE_CODE;
  const role = isAdminInvite ? ADMIN_ROLE_NAME : undefined;

  try {
    const member = await createMember({
      email: fields.email,
      password: fields.password,
      name: fields.name,
      employeeId: fields.employeeId,
      dept: fields.dept,
      unit: fields.unit,
      role,
      referredByCode: isAdminInvite ? undefined : fields.referredByCode,
      referredByName: isAdminInvite ? undefined : fields.referredByName,
    });
    // 註冊後不需要審核，直接視為登入成功。
    await createSession(String(member._id));
    return { success: true, memberCode: member.memberCode };
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === 11000) {
      return { error: "這個 Email、員工編號或帳號已經被註冊過了。" };
    }
    return { error: "發生錯誤，請稍後再試。" };
  }
}
