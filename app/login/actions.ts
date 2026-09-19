"use server";

import { verifyLogin } from "@/lib/models/member";
import { createSession, destroySession } from "@/lib/session";

export interface LoginState {
  error?: string;
  success?: boolean;
}

const errorMessages: Record<string, string> = {
  not_found: "查無此帳號。",
  wrong_password: "密碼錯誤。",
  pending: "帳號尚待審核，請稍後再試或聯繫管理員。",
  suspended: "帳號已被停權，請聯繫管理員。",
};

export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "請輸入 Email 與密碼。" };
  }

  const result = await verifyLogin(email, password);
  if (!result.ok) {
    return { error: errorMessages[result.reason] ?? "登入失敗。" };
  }

  await createSession(String(result.member._id));
  return { success: true };
}

export async function logoutAction() {
  await destroySession();
}
