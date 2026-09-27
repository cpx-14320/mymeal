"use server";

import { revalidatePath } from "next/cache";
import { setMembersStatus, deleteMembers, findMemberNames, type MemberStatus } from "@/lib/models/member";
import { deleteFavoritesByMembers } from "@/lib/models/favorite";
import { deleteItemReviewsByMembers } from "@/lib/models/item-review";
import { deleteFeedbackByMembers } from "@/lib/models/feedback";
import { removeMemberOrderLines } from "@/lib/models/group-order";
import { createAuditLog } from "@/lib/models/audit-log";
import { getCurrentActorName } from "@/lib/session";

/** 稽核紀錄的對象欄位：列出前 3 位姓名，其餘用「等 N 位」收尾。 */
function summarizeNames(names: string[]): string {
  if (names.length <= 3) return names.join("、");
  return `${names.slice(0, 3).join("、")} 等 ${names.length} 位`;
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

export interface DeleteMembersState {
  error?: string;
  deletedCount?: number;
}

/** 真的刪除會員（不是停權）：連同收藏／評論／意見回饋／團訂點餐紀錄一起清掉，見 deleteMembers 註解。 */
export async function deleteMembersAction(ids: string[]): Promise<DeleteMembersState> {
  if (ids.length === 0) return { error: "請先選取要刪除的會員。" };

  const actor = await getCurrentActorName();
  const names = await findMemberNames(ids);

  await Promise.all([
    deleteFavoritesByMembers(ids),
    deleteItemReviewsByMembers(ids),
    deleteFeedbackByMembers(ids),
    removeMemberOrderLines(ids),
  ]);
  const deletedCount = await deleteMembers(ids);

  await createAuditLog({
    actor,
    action: "刪除會員",
    target: summarizeNames(names),
    risk: true,
  });

  revalidatePath("/admin/members");
  revalidatePath("/admin/audit");
  return { deletedCount };
}
