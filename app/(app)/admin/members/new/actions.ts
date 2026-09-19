"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createMember, type MemberStatus } from "@/lib/models/member";
import { listDepartments, listUnits } from "@/lib/models/org";

export interface CreateMemberState {
  error?: string;
}

export async function createMemberAction(
  _prevState: CreateMemberState,
  formData: FormData,
): Promise<CreateMemberState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const employeeId = String(formData.get("employeeId") ?? "").trim();
  const dept = String(formData.get("dept") ?? "").trim();
  const unit = String(formData.get("unit") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  const status: MemberStatus = formData.get("active") === "on" ? "active" : "suspended";

  if (!email || !password || !name || !employeeId || !dept || !unit || !role) {
    return { error: "請填寫所有必填欄位。" };
  }
  if (password.length < 8) {
    return { error: "密碼至少需要 8 碼。" };
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

  let memberId: string;
  try {
    const member = await createMember({
      email,
      password,
      name,
      employeeId,
      dept,
      unit,
      role,
      status,
    });
    memberId = String(member._id);
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === 11000) {
      return { error: "這個 Email、員工編號或帳號已經被使用過了。" };
    }
    return { error: "發生錯誤，請稍後再試。" };
  }

  revalidatePath("/admin/members");
  redirect(`/admin/members/${memberId}`);
}
