"use server";

import { revalidatePath } from "next/cache";
import { deleteMembers, setMembersStatus, type MemberStatus } from "@/lib/models/member";

export interface BulkDeleteMembersState {
  error?: string;
  deletedCount?: number;
}

export async function bulkDeleteMembersAction(ids: string[]): Promise<BulkDeleteMembersState> {
  if (ids.length === 0) return { error: "請先選取要刪除的會員。" };

  const deletedCount = await deleteMembers(ids);
  revalidatePath("/admin/members");
  return { deletedCount };
}

export interface SetMembersStatusState {
  error?: string;
  updatedCount?: number;
}

export async function setMembersStatusAction(
  ids: string[],
  status: MemberStatus,
): Promise<SetMembersStatusState> {
  if (ids.length === 0) return { error: "請先選取要變更的會員。" };

  const updatedCount = await setMembersStatus(ids, status);
  revalidatePath("/admin/members");
  return { updatedCount };
}
