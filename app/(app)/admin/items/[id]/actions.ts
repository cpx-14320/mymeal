"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { updateCatalogItem, collectTagsFromFormData } from "@/lib/models/catalog-item";

export interface UpdateItemState {
  error?: string;
  success?: boolean;
}

export async function updateItemAction(
  id: string,
  _prevState: UpdateItemState,
  formData: FormData,
): Promise<UpdateItemState> {
  const name = String(formData.get("name") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const pageId = String(formData.get("pageId") ?? "").trim();
  const price = Number(formData.get("price") ?? 0);
  const emoji = String(formData.get("emoji") ?? "").trim();
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  const tags = collectTagsFromFormData(formData);
  const active = formData.get("active") !== "false";

  if (!name || !categoryId) return { error: "請填寫品項名稱並選擇分類。" };
  if (!Number.isFinite(price) || price < 0) return { error: "預設價請輸入正確的數字。" };

  try {
    await updateCatalogItem(id, {
      name,
      categoryId,
      pageId: pageId || undefined,
      price,
      tags,
      emoji,
      imageUrl: imageUrl || undefined,
      active,
    });
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "發生錯誤，請稍後再試。" };
  }

  revalidatePath("/admin/items");
  redirect("/admin/items");
}
