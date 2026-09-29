"use server";

import { revalidatePath } from "next/cache";
import {
  updateTemplateBasic,
  addTemplateSection,
  renameTemplateSection,
  deleteTemplateSection,
  addItemToSection,
  removeItemFromSection,
} from "@/lib/models/template";
import { requireAdminPermission } from "@/lib/admin-guard";

function refresh(id: string) {
  revalidatePath(`/admin/templates/${id}`);
  revalidatePath("/admin/templates");
}

export interface TemplateBasicState {
  error?: string;
  success?: boolean;
}

export async function updateTemplateBasicAction(
  id: string,
  _prevState: TemplateBasicState,
  formData: FormData,
): Promise<TemplateBasicState> {
  await requireAdminPermission("templates");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "請輸入模板名稱。" };

  await updateTemplateBasic(id, { name });
  refresh(id);
  return { success: true };
}

export async function addTemplateSectionAction(templateId: string, name: string) {
  await requireAdminPermission("templates");
  if (!name.trim()) throw new Error("請輸入區塊名稱。");
  await addTemplateSection(templateId, name.trim());
  refresh(templateId);
}

export async function renameTemplateSectionAction(templateId: string, sectionId: string, name: string) {
  await requireAdminPermission("templates");
  if (!name.trim()) throw new Error("請輸入區塊名稱。");
  await renameTemplateSection(templateId, sectionId, name.trim());
  refresh(templateId);
}

export async function deleteTemplateSectionAction(templateId: string, sectionId: string) {
  await requireAdminPermission("templates");
  await deleteTemplateSection(templateId, sectionId);
  refresh(templateId);
}

export async function addItemToSectionAction(templateId: string, sectionId: string, itemId: string) {
  await requireAdminPermission("templates");
  await addItemToSection(templateId, sectionId, itemId);
  refresh(templateId);
}

export async function removeItemFromSectionAction(templateId: string, sectionId: string, itemId: string) {
  await requireAdminPermission("templates");
  await removeItemFromSection(templateId, sectionId, itemId);
  refresh(templateId);
}
