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
  deleteTemplates,
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
  const kindId = String(formData.get("kindId") ?? "").trim();
  const supplierId = String(formData.get("supplierId") ?? "").trim();
  if (!name || !kindId) return { error: "請輸入模板名稱並選擇類型。" };

  await updateTemplateBasic(id, { name, kindId, supplierId: supplierId || undefined });
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

export interface DeleteTemplateState {
  error?: string;
  success?: boolean;
}

export async function deleteTemplateAction(id: string): Promise<DeleteTemplateState> {
  const deleted = await deleteTemplates([id]);
  if (!deleted) return { error: "找不到這個模板，可能已被刪除。" };
  revalidatePath("/admin/templates");
  revalidatePath("/admin/zones");
  return { success: true };
}
