"use server";

import { revalidatePath } from "next/cache";
import { updateMember, deleteMember, type MemberStatus } from "@/lib/models/member";

export interface UpdateMemberState {
  error?: string;
  success?: boolean;
}

export async function updateMemberAction(
  id: string,
  _prevState: UpdateMemberState,
  formData: FormData,
): Promise<UpdateMemberState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const employeeId = String(formData.get("employeeId") ?? "").trim();
  const dept = String(formData.get("dept") ?? "").trim();
  const unit = String(formData.get("unit") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  const status: MemberStatus = formData.get("active") === "on" ? "active" : "suspended";
  const password = String(formData.get("password") ?? "");

  if (!name || !email || !employeeId || !dept || !unit || !role) {
    return { error: "請填寫所有必填欄位。" };
  }
  if (password && password.length < 8) {
    return { error: "新密碼至少需要 8 碼。" };
  }

  try {
    const updated = await updateMember(id, {
      name,
      email,
      employeeId,
      dept,
      unit,
      role,
      status,
      password: password || undefined,
    });
    if (!updated) return { error: "找不到這位會員，可能已被刪除。" };
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === 11000) {
      return { error: "這個 Email、員工編號或帳號已經被其他會員使用。" };
    }
    return { error: "發生錯誤，請稍後再試。" };
  }

  revalidatePath("/admin/members");
  revalidatePath(`/admin/members/${id}`);
  return { success: true };
}

export interface DeleteMemberState {
  error?: string;
  success?: boolean;
}

export async function deleteMemberAction(id: string): Promise<DeleteMemberState> {
  const deleted = await deleteMember(id);
  if (!deleted) return { error: "找不到這位會員，可能已被刪除。" };

  revalidatePath("/admin/members");
  return { success: true };
}
