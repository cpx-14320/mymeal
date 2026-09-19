"use server";

import { revalidatePath } from "next/cache";
import { createItemKind, updateItemKind, deleteItemKind } from "@/lib/models/item-kind";

export interface KindFormState {
  error?: string;
  success?: boolean;
}

export async function createKindAction(
  _prevState: KindFormState,
  formData: FormData,
): Promise<KindFormState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "請輸入類型名稱。" };

  try {
    await createItemKind(name);
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "發生錯誤，請稍後再試。" };
  }

  revalidatePath("/admin/classification");
  revalidatePath("/admin/items");
  revalidatePath("/admin/items/new");
  return { success: true };
}

export interface UpdateKindState {
  error?: string;
  success?: boolean;
}

export async function updateKindAction(id: string, name: string): Promise<UpdateKindState> {
  const trimmed = name.trim();
  if (!trimmed) return { error: "請輸入類型名稱。" };

  try {
    await updateItemKind(id, trimmed);
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "發生錯誤，請稍後再試。" };
  }

  revalidatePath("/admin/classification");
  revalidatePath("/admin/items");
  return { success: true };
}

export interface DeleteKindState {
  error?: string;
  success?: boolean;
}

export async function deleteKindAction(id: string): Promise<DeleteKindState> {
  try {
    await deleteItemKind(id);
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "發生錯誤，請稍後再試。" };
  }

  revalidatePath("/admin/classification");
  revalidatePath("/admin/items");
  return { success: true };
}
