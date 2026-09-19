"use server";

import { revalidatePath } from "next/cache";
import { deleteRoles } from "@/lib/models/role";

export interface BulkDeleteRolesState {
  deleted: number;
  blocked: string[];
}

export async function deleteRolesAction(ids: string[]): Promise<BulkDeleteRolesState> {
  const result = await deleteRoles(ids);
  revalidatePath("/admin/roles");
  return result;
}
