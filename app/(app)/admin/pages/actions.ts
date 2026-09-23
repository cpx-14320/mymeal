"use server";

import { revalidatePath } from "next/cache";
import { setPagesActive, deletePages } from "@/lib/models/page";

export async function setPagesActiveAction(ids: string[], active: boolean) {
  await setPagesActive(ids, active);
  revalidatePath("/admin/pages");
}

export async function deletePagesAction(ids: string[]) {
  await deletePages(ids);
  revalidatePath("/admin/pages");
}
