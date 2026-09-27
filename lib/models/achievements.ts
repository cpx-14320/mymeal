import type { TaskType, DailyTaskView, TaskPeriod } from "@/lib/models/gamification";
import { getMemberOrderCount, getMemberOrderCountSince } from "@/lib/models/group-order";
import { getMemberTopupCount, getMemberTopupCountSince } from "@/lib/models/wallet";
import { listFavoritesByMember, countFavoritesSince } from "@/lib/models/favorite";
import { listReviewsByMember, listCommentsByMember, countReviewsSince } from "@/lib/models/item-review";
import { periodStartTaiwan } from "@/lib/date";

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

/** daily/weekly/monthly 任務的真實進度來源：算這位會員「從這個週期開始到現在」，
 *  各類型行為各發生了幾次——訂餐算 lines.createdAt（改單是整批刪舊建新，見 replaceMemberLines），
 *  儲值/收藏/評分/留言都各自查對應集合自己的時間欄位，見各自的 xxxSince 函式。 */
export async function getMemberPeriodCounts(
  memberId: string,
  period: Extract<TaskPeriod, "daily" | "weekly" | "monthly">,
): Promise<Record<TaskType, number>> {
  const since = periodStartTaiwan(period);
  const [orderCount, topupCount, favoriteCount, ratingCount, commentCount] = await Promise.all([
    getMemberOrderCountSince(memberId, since),
    getMemberTopupCountSince(memberId, since),
    countFavoritesSince(memberId, since),
    countReviewsSince(memberId, since, false),
    countReviewsSince(memberId, since, true),
  ]);

  return {
    order: orderCount,
    topup: topupCount,
    favorite: favoriteCount,
    rating: ratingCount,
    comment: commentCount,
  };
}

/** 依真實週期次數算 daily/weekly/monthly 任務進度——跟成就任務不同，每個任務要各自用自己
 *  週期的起始時間去查（每日任務查今天、每週任務查這週、每月任務查這個月），不能共用同一份次數。 */
export async function periodTaskProgress(memberId: string, tasks: DailyTaskView[]) {
  const periods: Extract<TaskPeriod, "daily" | "weekly" | "monthly">[] = ["daily", "weekly", "monthly"];
  const countsByPeriod = Object.fromEntries(
    await Promise.all(periods.map(async (p) => [p, await getMemberPeriodCounts(memberId, p)] as const)),
  ) as Record<(typeof periods)[number], Record<TaskType, number>>;

  return tasks
    .filter((t) => t.active && t.period !== "achievement")
    .map((t) => ({
      task: t,
      progress: Math.min(countsByPeriod[t.period as (typeof periods)[number]][t.type] ?? 0, t.targetCount),
    }));
}
