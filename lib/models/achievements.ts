import type { TaskType, DailyTaskView } from "@/lib/models/gamification";
import { getMemberOrderCount } from "@/lib/models/group-order";
import { getMemberTopupCount } from "@/lib/models/wallet";
import { listFavoritesByMember } from "@/lib/models/favorite";
import { listReviewsByMember, listCommentsByMember } from "@/lib/models/item-review";

/**
 * 成就（period="achievement"）任務的進度來源——跟 daily/weekly/monthly 不一樣，
 * 不經過 lib/mock.ts 的假資料，是帳號註冊至今、直接查 group_orders／wallet_ledger／
 * favorite／item_review 算出來的真實累積次數，永遠不會重置。
 */
export async function getMemberLifetimeCounts(memberId: string): Promise<Record<TaskType, number>> {
  const [orderCount, topupCount, favorites, ratings, comments] = await Promise.all([
    getMemberOrderCount(memberId),
    getMemberTopupCount(memberId),
    listFavoritesByMember(memberId),
    listReviewsByMember(memberId),
    listCommentsByMember(memberId),
  ]);

  return {
    order: orderCount,
    topup: topupCount,
    favorite: favorites.length,
    rating: ratings.length,
    comment: comments.length,
  };
}

/** 依真實累積次數算成就任務進度：跟週期任務不同，用 min(累積次數, 目標) 不會取模重置。 */
export function achievementProgress(tasks: DailyTaskView[], counts: Record<TaskType, number>) {
  return tasks
    .filter((t) => t.active && t.period === "achievement")
    .map((t) => ({
      task: t,
      progress: Math.min(counts[t.type] ?? 0, t.targetCount),
    }));
}
