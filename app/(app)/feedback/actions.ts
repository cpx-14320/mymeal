"use server";

import { createFeedback, type FeedbackType } from "@/lib/models/feedback";
import { getSessionMemberId } from "@/lib/session";
import { findMemberById } from "@/lib/models/member";

export interface FeedbackState {
  error?: string;
  success?: boolean;
}

const FEEDBACK_TYPES: FeedbackType[] = ["功能建議", "操作問題", "餐點 / 餐廳問題", "錢包 / 儲值問題", "其他"];

export async function submitFeedbackAction(
  _prevState: FeedbackState,
  formData: FormData,
): Promise<FeedbackState> {
  const typeRaw = String(formData.get("type") ?? "");
  const content = String(formData.get("content") ?? "").trim();
  if (!content) return { error: "請填寫意見內容。" };

  const type = FEEDBACK_TYPES.includes(typeRaw as FeedbackType) ? (typeRaw as FeedbackType) : "其他";

  const memberId = await getSessionMemberId();
  const member = memberId ? await findMemberById(memberId) : null;

  try {
    await createFeedback({
      type,
      content,
      memberId: memberId ?? undefined,
      senderName: member?.name ?? "訪客",
    });
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "發生錯誤，請稍後再試。" };
  }

  return { success: true };
}
