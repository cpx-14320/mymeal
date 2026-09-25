"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createCatalogItem, collectTagsFromFormData } from "@/lib/models/catalog-item";
import { getSessionMemberId } from "@/lib/session";
import { findMemberById } from "@/lib/models/member";

export interface CreateItemState {
  error?: string;
  success?: boolean;
}

export async function createItemAction(
  _prevState: CreateItemState,
  formData: FormData,
): Promise<CreateItemState> {
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

  const memberId = await getSessionMemberId();
  const member = memberId ? await findMemberById(memberId) : null;

  let itemId: string;
  try {
    const item = await createCatalogItem(
      {
        name,
        categoryId,
        pageId: pageId || undefined,
        price,
        tags,
        emoji,
        imageUrl: imageUrl || undefined,
        active,
      },
      member?.name,
    );
    itemId = item.id;
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "發生錯誤，請稍後再試。" };
  }

  revalidatePath("/admin/items");
  redirect(`/admin/items/${itemId}`);
}
