"use server";

import { createMember, findMemberByCode } from "@/lib/models/member";
import { createSession } from "@/lib/session";
import { listDepartments, listUnits } from "@/lib/models/org";

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
 */
const ADMIN_ROLE_NAME = "超級管理員";

export async function registerAction(
  _prevState: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const employeeId = String(formData.get("employeeId") ?? "").trim();
  const dept = String(formData.get("dept") ?? "").trim();
  const unit = String(formData.get("unit") ?? "").trim();
  const inviteCode = String(formData.get("inviteCode") ?? "").trim();

  if (!email || !password || !name || !employeeId || !dept || !unit) {
    return { error: "請填寫所有必填欄位。" };
  }
  if (password.length < 8) {
    return { error: "密碼至少需要 8 碼。" };
  }
  if (password !== confirmPassword) {
    return { error: "兩次輸入的密碼不一致。" };
  }
  const departments = await listDepartments();
  const matchedDept = departments.find((d) => d.name === dept);
  if (!matchedDept) {
    return { error: "請選擇有效的部門。" };
  }
  const units = await listUnits(matchedDept.id);
  if (!units.some((u) => u.name === unit)) {
    return { error: "請選擇有效的單位。" };
  }

  let role: string | undefined;
  let referrer: Awaited<ReturnType<typeof findMemberByCode>> = null;

  if (inviteCode && inviteCode === process.env.ADMIN_INVITE_CODE) {
    role = ADMIN_ROLE_NAME;
  } else if (inviteCode) {
    referrer = await findMemberByCode(inviteCode.toUpperCase());
  }

  try {
    const member = await createMember({
      email,
      password,
      name,
      employeeId,
      dept,
      unit,
      role,
      referredByCode: referrer?.memberCode,
      referredByName: referrer?.name,
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
