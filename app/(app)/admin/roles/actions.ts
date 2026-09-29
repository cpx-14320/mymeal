"use server";

import { revalidatePath } from "next/cache";
import { deleteRoles, listRoles } from "@/lib/models/role";
import { createAuditLog } from "@/lib/models/audit-log";
import { getCurrentActorName } from "@/lib/session";
import { requireAdminPermission } from "@/lib/admin-guard";

export interface BulkDeleteRolesState {
  deleted: number;
  blocked: string[];
}

export async function deleteRolesAction(ids: string[]): Promise<BulkDeleteRolesState> {
  await requireAdminPermission("roles");
  const roles = await listRoles();
  const names = roles.filter((r) => ids.includes(r.id)).map((r) => r.name);

  const result = await deleteRoles(ids);

  if (result.deleted > 0) {
    await createAuditLog({
      actor: await getCurrentActorName(),
      action: "刪除組別",
      target: names.join("、"),
      risk: true,
    });
  }

  revalidatePath("/admin/roles");
  revalidatePath("/admin/audit");
  return result;
}
