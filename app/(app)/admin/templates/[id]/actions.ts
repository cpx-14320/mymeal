"use server";

import { revalidatePath } from "next/cache";
import {
  updateTemplateBasic,
  addTemplateSection,
  renameTemplateSection,
  deleteTemplateSection,
  addItemToSection,
  removeItemFromSection,
  setTemplatesActive,
} from "@/lib/models/template";

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
  const name = String(formData.get("name") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const pageId = String(formData.get("pageId") ?? "").trim();
  if (!name || !categoryId) return { error: "請輸入模板名稱並選擇分類。" };

  await updateTemplateBasic(id, { name, categoryId, pageId: pageId || undefined });
  refresh(id);
  return { success: true };
}

export async function addTemplateSectionAction(templateId: string, name: string) {
  if (!name.trim()) throw new Error("請輸入分類名稱。");
  await addTemplateSection(templateId, name.trim());
  refresh(templateId);
}

export async function renameTemplateSectionAction(templateId: string, sectionId: string, name: string) {
  if (!name.trim()) throw new Error("請輸入分類名稱。");
  await renameTemplateSection(templateId, sectionId, name.trim());
  refresh(templateId);
}

export async function deleteTemplateSectionAction(templateId: string, sectionId: string) {
  await deleteTemplateSection(templateId, sectionId);
  refresh(templateId);
}

export async function addItemToSectionAction(templateId: string, sectionId: string, itemId: string) {
  await addItemToSection(templateId, sectionId, itemId);
  refresh(templateId);
}

export async function removeItemFromSectionAction(templateId: string, sectionId: string, itemId: string) {
  await removeItemFromSection(templateId, sectionId, itemId);
  refresh(templateId);
}

export async function setTemplateActiveAction(id: string, active: boolean) {
  await setTemplatesActive([id], active);
  refresh(id);
}
