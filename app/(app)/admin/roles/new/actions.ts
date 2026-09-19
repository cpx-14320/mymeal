"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createRole, type RolePermissions } from "@/lib/models/role";
import type { AdminNavKey } from "@/components/layout/nav";

export interface CreateRoleState {
  error?: string;
  success?: boolean;
}

function parsePermissions(formData: FormData): RolePermissions {
  const keys = formData.getAll("permissions").map(String) as AdminNavKey[];
  const permissions: RolePermissions = {};
  for (const key of keys) permissions[key] = true;
  return permissions;
}

export async function createRoleAction(
  _prevState: CreateRoleState,
  formData: FormData,
): Promise<CreateRoleState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "請填寫組別名稱。" };

  let roleId: string;
  try {
    const result = await createRole({ name, permissions: parsePermissions(formData) });
    roleId = result.id;
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "發生錯誤，請稍後再試。" };
  }

  revalidatePath("/admin/roles");
  redirect(`/admin/roles/${roleId}`);
}
