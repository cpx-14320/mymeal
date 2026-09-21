"use server";

import { revalidatePath } from "next/cache";
import { updateRole, deleteRole, findRoleById, type RolePermissions } from "@/lib/models/role";
import type { AdminNavKey } from "@/components/layout/nav";
import { createAuditLog } from "@/lib/models/audit-log";
import { getCurrentActorName } from "@/lib/session";

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

  await createAuditLog({
    actor: await getCurrentActorName(),
    action: "編輯組別權限",
    target: name,
    risk: true,
  });

  revalidatePath("/admin/roles");
  revalidatePath(`/admin/roles/${id}`);
  revalidatePath("/admin/audit");
  return { success: true };
}

export interface DeleteRoleState {
  error?: string;
  success?: boolean;
}

export async function deleteRoleAction(id: string): Promise<DeleteRoleState> {
  const role = await findRoleById(id);
  try {
    const deleted = await deleteRole(id);
    if (!deleted) return { error: "找不到這個組別，可能已被刪除。" };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "發生錯誤，請稍後再試。" };
  }

  await createAuditLog({
    actor: await getCurrentActorName(),
    action: "刪除組別",
    target: role?.name ?? id,
    risk: true,
  });

  revalidatePath("/admin/roles");
  revalidatePath("/admin/audit");
  return { success: true };
}
