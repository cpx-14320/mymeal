"use server";

import { revalidatePath } from "next/cache";
import { deleteFeedback } from "@/lib/models/feedback";
import { requireAdminPermission } from "@/lib/admin-guard";

export async function deleteFeedbackAction(id: string) {
  await requireAdminPermission("feedback");
  await deleteFeedback([id]);
  revalidatePath("/admin/feedback");
}
