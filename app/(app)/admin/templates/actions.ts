"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  createTemplate,
  setTemplatesActive,
  deleteTemplates,
  type TemplateBasicInput,
} from "@/lib/models/template";
import { getSessionMemberId } from "@/lib/session";
import { findMemberById } from "@/lib/models/member";

export interface CreateTemplateState {
  error?: string;
}

export async function createTemplateAction(
  _prevState: CreateTemplateState,
  formData: FormData,
): Promise<CreateTemplateState> {
  const name = String(formData.get("name") ?? "").trim();
  const kindId = String(formData.get("kindId") ?? "").trim();
  const supplierId = String(formData.get("supplierId") ?? "").trim();
  if (!name || !kindId) return { error: "請輸入模板名稱並選擇類型。" };

  const input: TemplateBasicInput = { name, kindId, supplierId: supplierId || undefined };
  const memberId = await getSessionMemberId();
  const member = memberId ? await findMemberById(memberId) : null;

  let templateId: string;
  try {
    const result = await createTemplate(input, member?.name);
    templateId = result.id;
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "發生錯誤，請稍後再試。" };
  }

  revalidatePath("/admin/templates");
  redirect(`/admin/templates/${templateId}`);
}

export async function setTemplatesActiveAction(ids: string[], active: boolean) {
  await setTemplatesActive(ids, active);
  revalidatePath("/admin/templates");
}

export async function deleteTemplatesAction(ids: string[]) {
  await deleteTemplates(ids);
  revalidatePath("/admin/templates");
  revalidatePath("/admin/zones");
}
