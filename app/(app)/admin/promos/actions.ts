"use server";

import { revalidatePath } from "next/cache";
import { setInterstitialsEnabled, deleteInterstitials } from "@/lib/models/interstitial";

export async function setPromosEnabledAction(ids: string[], enabled: boolean) {
  await setInterstitialsEnabled(ids, enabled);
  revalidatePath("/admin/promos");
}

export async function deletePromosAction(ids: string[]) {
  await deleteInterstitials(ids);
  revalidatePath("/admin/promos");
}
