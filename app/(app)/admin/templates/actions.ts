"use server";

import { revalidatePath } from "next/cache";
import { setTemplatesActive, deleteTemplates } from "@/lib/models/template";
import { requireAdminPermission } from "@/lib/admin-guard";

export async function setTemplatesActiveAction(ids: string[], active: boolean) {
  await requireAdminPermission("templates");
  await setTemplatesActive(ids, active);
  revalidatePath("/admin/templates");
}

export async function deleteTemplatesAction(ids: string[]) {
  await requireAdminPermission("templates");
  await deleteTemplates(ids);
  revalidatePath("/admin/templates");
}
