"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { setHomePreviewConfig } from "@/lib/models/site-settings";
import { requireAdminPermission } from "@/lib/admin-guard";

export interface SaveHomePreviewState {
  error?: string;
}

export async function saveHomePreviewTemplateAction(
  _prevState: SaveHomePreviewState,
  formData: FormData,
): Promise<SaveHomePreviewState> {
  await requireAdminPermission("homePreview");
  const templateId = String(formData.get("templateId") ?? "").trim();
  const sectionId = String(formData.get("sectionId") ?? "").trim();
  await setHomePreviewConfig({ templateId: templateId || undefined, sectionId: sectionId || undefined });

  revalidatePath("/admin/promos");
  revalidatePath("/");
  redirect("/admin/promos?saved=1&tab=homePreview");
}
