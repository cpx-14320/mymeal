"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { setHomePreviewTemplateId } from "@/lib/models/site-settings";

export interface SaveHomePreviewState {
  error?: string;
}

export async function saveHomePreviewTemplateAction(
  _prevState: SaveHomePreviewState,
  formData: FormData,
): Promise<SaveHomePreviewState> {
  const templateId = String(formData.get("templateId") ?? "").trim();
  await setHomePreviewTemplateId(templateId || null);

  revalidatePath("/admin/home-preview");
  revalidatePath("/");
  redirect("/admin/home-preview?saved=1");
}
