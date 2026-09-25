"use server";

import { revalidatePath } from "next/cache";
import {
  createItemCategory,
  updateItemCategory,
  deleteItemCategory,
  reorderItemCategories,
} from "@/lib/models/item-category";

export interface CategoryFormState {
  error?: string;
  success?: boolean;
}

export async function createCategoryAction(
  _prevState: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "請輸入分類名稱。" };

  try {
    await createItemCategory(name);
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "發生錯誤，請稍後再試。" };
  }

  revalidatePath("/admin/classification");
  revalidatePath("/admin/items");
  revalidatePath("/admin/items/new");
  return { success: true };
}

export interface UpdateCategoryState {
  error?: string;
  success?: boolean;
}

export async function updateCategoryAction(id: string, name: string): Promise<UpdateCategoryState> {
  const trimmed = name.trim();
  if (!trimmed) return { error: "請輸入分類名稱。" };

  try {
    await updateItemCategory(id, trimmed);
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "發生錯誤，請稍後再試。" };
  }

  revalidatePath("/admin/classification");
  revalidatePath("/admin/items");
  return { success: true };
}

export interface ReorderCategoryState {
  error?: string;
  success?: boolean;
}

export async function reorderCategoryAction(orderedIds: string[]): Promise<ReorderCategoryState> {
  try {
    await reorderItemCategories(orderedIds);
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "發生錯誤，請稍後再試。" };
  }

  revalidatePath("/admin/classification");
  revalidatePath("/admin/items");
  revalidatePath("/admin/items/new");
  return { success: true };
}

export interface DeleteCategoryState {
  error?: string;
  success?: boolean;
}

export async function deleteCategoryAction(id: string): Promise<DeleteCategoryState> {
  try {
    await deleteItemCategory(id);
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "發生錯誤，請稍後再試。" };
  }

  revalidatePath("/admin/classification");
  revalidatePath("/admin/items");
  return { success: true };
}
