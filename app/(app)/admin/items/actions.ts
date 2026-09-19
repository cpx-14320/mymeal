"use server";

import { revalidatePath } from "next/cache";
import { setCatalogItemsActive, deleteCatalogItems } from "@/lib/models/catalog-item";

export async function setItemsActiveAction(ids: string[], active: boolean) {
  await setCatalogItemsActive(ids, active);
  revalidatePath("/admin/items");
}

export async function deleteItemsAction(ids: string[]) {
  await deleteCatalogItems(ids);
  revalidatePath("/admin/items");
}
