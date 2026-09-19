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
