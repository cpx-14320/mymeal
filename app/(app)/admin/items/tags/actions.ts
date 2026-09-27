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
} from "@/lib/models/tag-group";

function refresh() {
  revalidatePath("/admin/classification");
  revalidatePath("/admin/items");
  revalidatePath("/admin/items/new");
}

export async function createTagGroupAction() {
  const group = await createTagGroup("新群組");
  refresh();
  return group;
}

export async function renameTagGroupAction(id: string, name: string) {
  await renameTagGroup(id, name);
  refresh();
}

export async function toggleTagGroupMultiAction(id: string, multi: boolean) {
  await setTagGroupMulti(id, multi);
  refresh();
}

export async function addTagOptionAction(id: string, option: string) {
  await addTagOption(id, option);
  refresh();
}

/** 改名/移除/整組刪除前先呼叫這支：回傳哪些選項在其他群組也有用到（連帶會被 cascade 波及），
 *  讓後台介面在動手前跳出確認訊息。 */
export async function checkTagOptionsUsageAction(
  id: string,
  options: string[],
): Promise<Record<string, string[]>> {
  return findGroupsUsingOptions(id, options);
}

export async function renameTagOptionAction(id: string, oldOption: string, newOption: string) {
  await renameTagOption(id, oldOption, newOption);
  refresh();
}

export async function removeTagOptionAction(id: string, option: string) {
  await removeTagOption(id, option);
  refresh();
}

export async function deleteTagGroupAction(id: string) {
  await deleteTagGroup(id);
  refresh();
}

export interface ReorderTagState {
  error?: string;
}

export async function reorderTagGroupsAction(orderedIds: string[]): Promise<ReorderTagState> {
  try {
    await reorderTagGroups(orderedIds);
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "發生錯誤，請稍後再試。" };
  }
  refresh();
  return {};
}

export async function reorderTagOptionsAction(id: string, orderedOptions: string[]): Promise<ReorderTagState> {
  try {
    await reorderTagOptions(id, orderedOptions);
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "發生錯誤，請稍後再試。" };
  }
  refresh();
  return {};
}
