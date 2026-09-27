"use server";

import { revalidatePath } from "next/cache";
import { deleteFeedback } from "@/lib/models/feedback";

export async function deleteFeedbackAction(id: string) {
  await deleteFeedback([id]);
  revalidatePath("/admin/feedback");
}
