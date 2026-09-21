"use server";

import { revalidatePath } from "next/cache";
import { deleteMembers, setMembersStatus, findMemberNames, type MemberStatus } from "@/lib/models/member";
import { createAuditLog } from "@/lib/models/audit-log";
import { getCurrentActorName } from "@/lib/session";

/** 稽核紀錄的對象欄位：列出前 3 位姓名，其餘用「等 N 位」收尾。 */
function summarizeNames(names: string[]): string {
  if (names.length <= 3) return names.join("、");
  return `${names.slice(0, 3).join("、")} 等 ${names.length} 位`;
}

export interface BulkDeleteMembersState {
  error?: string;
  deletedCount?: number;
}

export async function bulkDeleteMembersAction(ids: string[]): Promise<BulkDeleteMembersState> {
  if (ids.length === 0) return { error: "請先選取要刪除的會員。" };

  const actor = await getCurrentActorName();
  const names = await findMemberNames(ids);
  const deletedCount = await deleteMembers(ids);

  await createAuditLog({ actor, action: "刪除會員", target: summarizeNames(names), risk: true });

  revalidatePath("/admin/members");
  revalidatePath("/admin/audit");
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

  const actor = await getCurrentActorName();
  const names = await findMemberNames(ids);
  const updatedCount = await setMembersStatus(ids, status);

  const statusActionLabel: Record<MemberStatus, string> = {
    active: "復權會員",
    suspended: "停權會員",
    pending: "會員改為待審核",
  };
  await createAuditLog({
    actor,
    action: statusActionLabel[status],
    target: summarizeNames(names),
    risk: true,
  });

  revalidatePath("/admin/members");
  revalidatePath("/admin/audit");
  return { updatedCount };
}
