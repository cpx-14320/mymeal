"use server";

import { revalidatePath } from "next/cache";
import { setOrderZonesActive, deleteOrderZones } from "@/lib/models/order-zone";

export async function setZonesActiveAction(ids: string[], active: boolean) {
  await setOrderZonesActive(ids, active);
  revalidatePath("/admin/zones");
}

export async function deleteZonesAction(ids: string[]) {
  await deleteOrderZones(ids);
  revalidatePath("/admin/zones");
}
