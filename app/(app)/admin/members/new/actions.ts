"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createMember, parseMemberForm, type MemberStatus } from "@/lib/models/member";
import { requireAdminPermission } from "@/lib/admin-guard";

export interface CreateMemberState {
  error?: string;
}

export async function createMemberAction(
  _prevState: CreateMemberState,
  formData: FormData,
): Promise<CreateMemberState> {
  await requireAdminPermission("members");
  const parsed = await parseMemberForm(formData);
  if (!parsed.ok) return { error: parsed.error };
  const fields = parsed.fields;

  const role = String(formData.get("role") ?? "").trim();
  if (!role) return { error: "請選擇權限。" };
  const status: MemberStatus = formData.get("active") === "on" ? "active" : "suspended";

  try {
    await createMember({
      email: fields.email,
      password: fields.password,
      name: fields.name,
      employeeId: fields.employeeId,
      dept: fields.dept,
      unit: fields.unit,
      role,
      referredByCode: fields.referredByCode,
      referredByName: fields.referredByName,
      status,
    });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === 11000) {
      return { error: "這個 Email、員工編號或帳號已經被使用過了。" };
    }
    return { error: "發生錯誤，請稍後再試。" };
  }

  revalidatePath("/admin/members");
  redirect(`/admin/members?created=1`);
}
