"use server";

import { revalidatePath } from "next/cache";
import { approveTopupRequest, rejectTopupRequest, deleteTopupRequest } from "@/lib/models/topup-request";

export interface TopupActionState {
  error?: string;
  success?: boolean;
}

export async function approveTopupAction(id: string): Promise<TopupActionState> {
  try {
    await approveTopupRequest(id);
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "發生錯誤，請稍後再試。" };
  }
  revalidatePath("/admin/topups");
  revalidatePath("/admin/wallets");
  revalidatePath("/admin");
  return { success: true };
}

export async function rejectTopupAction(id: string, reviewNote?: string): Promise<TopupActionState> {
  try {
    await rejectTopupRequest(id, reviewNote);
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "發生錯誤，請稍後再試。" };
  }
  revalidatePath("/admin/topups");
  revalidatePath("/admin");
  return { success: true };
}

export async function deleteTopupAction(id: string): Promise<TopupActionState> {
  try {
    await deleteTopupRequest(id);
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "發生錯誤，請稍後再試。" };
  }
  revalidatePath("/admin/topups");
  revalidatePath("/admin");
  return { success: true };
}
