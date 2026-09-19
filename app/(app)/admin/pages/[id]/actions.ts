"use server";

import { revalidatePath } from "next/cache";
import { updateSupplier, deleteSuppliers, type SupplierInput } from "@/lib/models/supplier";

export interface UpdateSupplierState {
  error?: string;
  success?: boolean;
}

function parseInput(formData: FormData): SupplierInput | { error: string } {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const icon = String(formData.get("icon") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const sortOrder = Number(formData.get("sortOrder") ?? 0);
  const openInNewTab = formData.get("openInNewTab") === "on";
  if (!name || !slug) return { error: "請填寫所有必填欄位。" };
  if (!/^[a-z0-9-]+$/.test(slug)) return { error: "網址代稱只能使用小寫英文字母、數字與連字號（-）。" };
  if (!Number.isFinite(sortOrder)) return { error: "排序請輸入數字。" };
  return { name, description, icon, slug, sortOrder, openInNewTab };
}

export async function updateSupplierAction(
  id: string,
  _prevState: UpdateSupplierState,
  formData: FormData,
): Promise<UpdateSupplierState> {
  const input = parseInput(formData);
  if ("error" in input) return { error: input.error };

  try {
    await updateSupplier(id, input);
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "發生錯誤，請稍後再試。" };
  }

  revalidatePath("/admin/pages");
  revalidatePath(`/admin/pages/${id}`);
  return { success: true };
}

export interface DeleteSupplierState {
  error?: string;
  success?: boolean;
}

export async function deleteSupplierAction(id: string): Promise<DeleteSupplierState> {
  const deleted = await deleteSuppliers([id]);
  if (!deleted) return { error: "找不到這個店家，可能已被刪除。" };

  revalidatePath("/admin/pages");
  return { success: true };
}
