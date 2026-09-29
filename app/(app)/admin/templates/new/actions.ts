"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createTemplate } from "@/lib/models/template";
import { getSessionMemberId } from "@/lib/session";
import { findMemberById } from "@/lib/models/member";

export interface CreateTemplateState {
  error?: string;
}

export async function createTemplateAction(
  _prevState: CreateTemplateState,
  formData: FormData,
): Promise<CreateTemplateState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "請填寫模板名稱。" };

  const memberId = await getSessionMemberId();
  const member = memberId ? await findMemberById(memberId) : null;

  await createTemplate({ name }, member?.name, memberId ?? undefined);

  revalidatePath("/admin/templates");
  redirect("/admin/templates?created=1");
}
