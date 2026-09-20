"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupplier, type SupplierInput } from "@/lib/models/supplier";
import { getSessionMemberId } from "@/lib/session";
import { findMemberById } from "@/lib/models/member";

export interface CreateSupplierState {
  error?: string;
  success?: boolean;
}

function parseInput(formData: FormData): SupplierInput | { error: string } {
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

export async function createSupplierAction(
  _prevState: CreateSupplierState,
  formData: FormData,
): Promise<CreateSupplierState> {
  const input = parseInput(formData);
  if ("error" in input) return { error: input.error };

  const memberId = await getSessionMemberId();
  const member = memberId ? await findMemberById(memberId) : null;

  let supplierId: string;
  try {
    const supplier = await createSupplier(input, member?.name);
    supplierId = supplier.id;
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "發生錯誤，請稍後再試。" };
  }

  revalidatePath("/admin/pages");
  redirect(`/admin/pages/${supplierId}`);
}
