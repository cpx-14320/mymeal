"use server";

import { revalidatePath } from "next/cache";
import {
  createDepartment,
  deleteDepartment,
  updateDepartment,
  createUnit,
  deleteUnit,
  updateUnit,
} from "@/lib/models/org";

export interface OrgFormState {
  error?: string;
  success?: boolean;
}

export async function createDepartmentAction(
  _prevState: OrgFormState,
  formData: FormData,
): Promise<OrgFormState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "請輸入部門名稱。" };

  try {
    await createDepartment(name);
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "發生錯誤，請稍後再試。" };
  }

  revalidatePath("/admin/org");
  revalidatePath("/register");
  return { success: true };
}

export async function createUnitAction(
  _prevState: OrgFormState,
  formData: FormData,
): Promise<OrgFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const departmentId = String(formData.get("departmentId") ?? "").trim();
  if (!name) return { error: "請輸入單位名稱。" };
  if (!departmentId) return { error: "請選擇所屬部門。" };

  try {
    await createUnit(name, departmentId);
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "發生錯誤，請稍後再試。" };
  }

  revalidatePath("/admin/org");
  revalidatePath("/register");
  return { success: true };
}

export interface DeleteOrgState {
  error?: string;
  success?: boolean;
}

export async function updateDepartmentAction(id: string, name: string): Promise<DeleteOrgState> {
  const trimmed = name.trim();
  if (!trimmed) return { error: "請輸入部門名稱。" };

  try {
    await updateDepartment(id, trimmed);
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "發生錯誤，請稍後再試。" };
  }

  revalidatePath("/admin/org");
  revalidatePath("/admin/members");
  revalidatePath("/register");
  return { success: true };
}

export async function updateUnitAction(id: string, name: string): Promise<DeleteOrgState> {
  const trimmed = name.trim();
  if (!trimmed) return { error: "請輸入單位名稱。" };

  try {
    await updateUnit(id, trimmed);
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "發生錯誤，請稍後再試。" };
  }

  revalidatePath("/admin/org");
  revalidatePath("/admin/members");
  revalidatePath("/register");
  return { success: true };
}

export async function deleteDepartmentAction(id: string): Promise<DeleteOrgState> {
  const deleted = await deleteDepartment(id);
  if (!deleted) return { error: "找不到這筆資料，可能已被刪除。" };

  revalidatePath("/admin/org");
  revalidatePath("/register");
  return { success: true };
}

export async function deleteUnitAction(id: string): Promise<DeleteOrgState> {
  const deleted = await deleteUnit(id);
  if (!deleted) return { error: "找不到這筆資料，可能已被刪除。" };

  revalidatePath("/admin/org");
  revalidatePath("/register");
  return { success: true };
}
