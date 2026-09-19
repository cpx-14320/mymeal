"use server";

import { revalidatePath } from "next/cache";
import { setSuppliersActive, deleteSuppliers } from "@/lib/models/supplier";

export async function setSuppliersActiveAction(ids: string[], active: boolean) {
  await setSuppliersActive(ids, active);
  revalidatePath("/admin/pages");
}

export async function deleteSuppliersAction(ids: string[]) {
  await deleteSuppliers(ids);
  revalidatePath("/admin/pages");
}
