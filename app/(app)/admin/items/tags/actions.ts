"use server";

import { revalidatePath } from "next/cache";
import {
  createTagGroup,
  renameTagGroup,
  setTagGroupMulti,
  addTagOption,
  renameTagOption,
  removeTagOption,
  deleteTagGroup,
  reorderTagGroups,
  reorderTagOptions,
  findGroupsUsingOptions,
  listTagGroups,
} from "@/lib/models/tag-group";
import { createAuditLog } from "@/lib/models/audit-log";
import { getCurrentActorName } from "@/lib/session";
import { requireAdminPermission } from "@/lib/admin-guard";

function refresh() {
  revalidatePath("/admin/classification");
  revalidatePath("/admin/items");
  revalidatePath("/admin/items/new");
  revalidatePath("/admin/audit");
}

async function logTagAudit(action: string, target?: string) {
  const actor = await getCurrentActorName();
  await createAuditLog({ actor, action, target, category: "catalog" });
}

export async function createTagGroupAction() {
  await requireAdminPermission("itemClassification");
  const group = await createTagGroup("新群組");
  await logTagAudit("新增標籤群組", group.name);
  refresh();
  return group;
}

export async function renameTagGroupAction(id: string, name: string) {
  await requireAdminPermission("itemClassification");
  const before = (await listTagGroups()).find((g) => g.id === id);
  await renameTagGroup(id, name);
  await logTagAudit("標籤群組改名", before ? `${before.name}→${name}` : name);
  refresh();
}

export async function toggleTagGroupMultiAction(id: string, multi: boolean) {
  await requireAdminPermission("itemClassification");
  const group = await setTagGroupMulti(id, multi);
  await logTagAudit(multi ? "標籤群組改為可複選" : "標籤群組改為單選", group?.name);
  refresh();
}

export async function addTagOptionAction(id: string, option: string) {
  await requireAdminPermission("itemClassification");
  const group = await addTagOption(id, option);
  await logTagAudit("新增標籤選項", group ? `${group.name}．${option}` : option);
  refresh();
}

/** 改名/移除/整組刪除前先呼叫這支：回傳哪些選項在其他群組也有用到（連帶會被 cascade 波及），
 *  讓後台介面在動手前跳出確認訊息。 */
export async function checkTagOptionsUsageAction(
  id: string,
  options: string[],
): Promise<Record<string, string[]>> {
  await requireAdminPermission("itemClassification");
  return findGroupsUsingOptions(id, options);
}

export async function renameTagOptionAction(id: string, oldOption: string, newOption: string) {
  await requireAdminPermission("itemClassification");
  const group = await renameTagOption(id, oldOption, newOption);
  const actor = await getCurrentActorName();
  await createAuditLog({
    actor,
    action: "標籤選項改名",
    target: group ? `${group.name}．${oldOption}→${newOption}（已同步套用到品項）` : `${oldOption}→${newOption}`,
    category: "catalog",
    risk: true,
  });
  refresh();
}

export async function removeTagOptionAction(id: string, option: string) {
  await requireAdminPermission("itemClassification");
  const group = await removeTagOption(id, option);
  const actor = await getCurrentActorName();
  await createAuditLog({
    actor,
    action: "移除標籤選項",
    target: group ? `${group.name}．${option}（已從品項移除）` : option,
    category: "catalog",
    risk: true,
  });
  refresh();
}

export async function deleteTagGroupAction(id: string) {
  await requireAdminPermission("itemClassification");
  const before = (await listTagGroups()).find((g) => g.id === id);
  await deleteTagGroup(id);
  const actor = await getCurrentActorName();
  await createAuditLog({
    actor,
    action: "刪除標籤群組",
    target: before ? `${before.name}（${before.options.length} 個選項已從品項移除）` : id,
    category: "catalog",
    risk: true,
  });
  refresh();
}

export interface ReorderTagState {
  error?: string;
}

export async function reorderTagGroupsAction(orderedIds: string[]): Promise<ReorderTagState> {
  try {
    await requireAdminPermission("itemClassification");
    await reorderTagGroups(orderedIds);
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "發生錯誤，請稍後再試。" };
  }
  refresh();
  return {};
}

export async function reorderTagOptionsAction(id: string, orderedOptions: string[]): Promise<ReorderTagState> {
  try {
    await requireAdminPermission("itemClassification");
    await reorderTagOptions(id, orderedOptions);
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "發生錯誤，請稍後再試。" };
  }
  refresh();
  return {};
}
