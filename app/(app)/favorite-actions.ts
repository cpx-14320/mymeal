"use server";

import { revalidatePath } from "next/cache";
import { toggleFavorite } from "@/lib/models/favorite";
import { getSessionMemberId } from "@/lib/session";

export interface ToggleFavoriteState {
  favorited: boolean;
  error?: string;
}

/** 收藏愛心共用的 action：/catalog、/favorites、/pages/[slug] 的 ItemGrid 都是呼叫這支。 */
export async function toggleFavoriteAction(itemId: string): Promise<ToggleFavoriteState> {
  const memberId = await getSessionMemberId();
  if (!memberId) return { favorited: false, error: "請先登入。" };

  try {
    const result = await toggleFavorite(memberId, itemId);
    revalidatePath("/favorites");
    return result;
  } catch (err: unknown) {
    return { favorited: false, error: err instanceof Error ? err.message : "發生錯誤，請稍後再試。" };
  }
}
