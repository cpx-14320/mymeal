"use server";

import { revalidatePath } from "next/cache";
import { setInterstitialsEnabled, deleteInterstitials } from "@/lib/models/interstitial";
import { requireAdminPermission } from "@/lib/admin-guard";

export async function setPromosEnabledAction(ids: string[], enabled: boolean) {
  await requireAdminPermission("promos");
  await setInterstitialsEnabled(ids, enabled);
  revalidatePath("/admin/promos");
}

export async function deletePromosAction(ids: string[]) {
  await requireAdminPermission("promos");
  await deleteInterstitials(ids);
  revalidatePath("/admin/promos");
}
