"use server";

import { revalidatePath } from "next/cache";
import { setTemplatesActive, deleteTemplates } from "@/lib/models/template";

export async function setTemplatesActiveAction(ids: string[], active: boolean) {
  await setTemplatesActive(ids, active);
  revalidatePath("/admin/templates");
}

export async function deleteTemplatesAction(ids: string[]) {
  await deleteTemplates(ids);
  revalidatePath("/admin/templates");
}
