"use server";

import { revalidatePath } from "next/cache";
import { updatePage, deletePages, type PageInput } from "@/lib/models/page";

export interface UpdatePageState {
  error?: string;
  success?: boolean;
}

function parseInput(formData: FormData): PageInput | { error: string } {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const icon = String(formData.get("icon") ?? "").trim();
  const iconSvg = String(formData.get("iconSvg") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const sortOrder = Number(formData.get("sortOrder") ?? 0);
  const openInNewTab = formData.get("openInNewTab") === "on";
  const showTopItems = formData.get("showTopItems") === "on";
  const templateId = String(formData.get("templateId") ?? "").trim() || undefined;
  if (!name || !slug) return { error: "請填寫所有必填欄位。" };
  if (!/^[a-z0-9-]+$/.test(slug)) return { error: "網址代稱只能使用小寫英文字母、數字與連字號（-）。" };
  if (!Number.isFinite(sortOrder)) return { error: "排序請輸入數字。" };
  return { name, description, icon, iconSvg, slug, sortOrder, openInNewTab, showTopItems, templateId };
}

export async function updatePageAction(
  id: string,
  _prevState: UpdatePageState,
  formData: FormData,
): Promise<UpdatePageState> {
  const input = parseInput(formData);
  if ("error" in input) return { error: input.error };

  try {
    await updatePage(id, input);
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "發生錯誤，請稍後再試。" };
  }

  revalidatePath("/admin/pages");
  revalidatePath(`/admin/pages/${id}`);
  return { success: true };
}

export interface DeletePageState {
  error?: string;
  success?: boolean;
}

export async function deletePageAction(id: string): Promise<DeletePageState> {
  const deleted = await deletePages([id]);
  if (!deleted) return { error: "找不到這個頁面，可能已被刪除。" };

  revalidatePath("/admin/pages");
  return { success: true };
}
