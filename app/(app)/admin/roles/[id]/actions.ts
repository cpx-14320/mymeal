"use server";

import { revalidatePath } from "next/cache";
import { updateRole, deleteRole, type RolePermissions } from "@/lib/models/role";
import type { AdminNavKey } from "@/components/layout/nav";

export interface UpdateRoleState {
  error?: string;
  success?: boolean;
}

function parsePermissions(formData: FormData): RolePermissions {
  const keys = formData.getAll("permissions").map(String) as AdminNavKey[];
  const permissions: RolePermissions = {};
  for (const key of keys) permissions[key] = true;
  return permissions;
}

export async function updateRoleAction(
  id: string,
  _prevState: UpdateRoleState,
  formData: FormData,
): Promise<UpdateRoleState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "請填寫組別名稱。" };

  try {
    await updateRole(id, { name, permissions: parsePermissions(formData) });
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "發生錯誤，請稍後再試。" };
  }

  revalidatePath("/admin/roles");
  revalidatePath(`/admin/roles/${id}`);
  return { success: true };
}

export interface DeleteRoleState {
  error?: string;
  success?: boolean;
}

export async function deleteRoleAction(id: string): Promise<DeleteRoleState> {
  try {
    const deleted = await deleteRole(id);
    if (!deleted) return { error: "找不到這個組別，可能已被刪除。" };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "發生錯誤，請稍後再試。" };
  }

  revalidatePath("/admin/roles");
  return { success: true };
}
