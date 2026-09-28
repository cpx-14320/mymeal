import type { TaskType, DailyTaskView, TaskPeriod } from "@/lib/models/gamification";
import { getMemberOrderCount, getMemberOrderCountSince } from "@/lib/models/group-order";
import { getMemberTopupCount, getMemberTopupCountSince } from "@/lib/models/wallet";
import { listFavoritesByMember, countFavoritesSince } from "@/lib/models/favorite";
import { listReviewsByMember, listCommentsByMember, countReviewsSince } from "@/lib/models/item-review";
import { periodStartTaiwan } from "@/lib/date";
import { grantTaskCompletion, listCompletedTaskPeriods } from "@/lib/models/task-completion";

type PeriodType = Extract<TaskPeriod, "daily" | "weekly" | "monthly">;
const PERIOD_TYPES: PeriodType[] = ["daily", "weekly", "monthly"];

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

async function getAllPeriodCounts(memberId: string): Promise<Record<PeriodType, Record<TaskType, number>>> {
  const entries = await Promise.all(PERIOD_TYPES.map(async (p) => [p, await getMemberPeriodCounts(memberId, p)] as const));
  return Object.fromEntries(entries) as Record<PeriodType, Record<TaskType, number>>;
}

/** 依真實週期次數算 daily/weekly/monthly 任務進度——跟成就任務不同，每個任務要各自用自己
 *  週期的起始時間去查（每日任務查今天、每週任務查這週、每月任務查這個月），不能共用同一份次數。 */
export async function periodTaskProgress(memberId: string, tasks: DailyTaskView[]) {
  const countsByPeriod = await getAllPeriodCounts(memberId);

  return tasks
    .filter((t) => t.active && t.period !== "achievement")
    .map((t) => ({
      task: t,
      progress: Math.min(countsByPeriod[t.period as PeriodType][t.type] ?? 0, t.targetCount),
    }));
}

/**
 * 檢查這位會員目前所有啟用中的任務，「已經達標但這個週期／成就還沒發過完成獎勵」的就補發一筆
 * gamification_task_completions 紀錄（週期任務用「現在」所屬的週期、成就任務固定用
 * "achievement"）——lazy 補發，在算進度/exp 之前呼叫即可，不用在訂餐/儲值/收藏/評分留言各自
 * 的動作程式碼裡插入發獎邏輯，跟 gamification.ts 的 seedIfEmpty 同樣精神、單一入口。
 * 這裡永遠只檢查「現在」這個當下的週期，不會回頭建構過去已結束週期的歷史，所以已經結束的週期
 * 不會被這裡補發、也不會被改寫；已經發出去的完成獎勵，不論之後構成達標的行為是否被取消／撤銷，
 * 都不會被這裡（或任何地方）追溯收回——這是刻意的設計，見 task-completion.ts 的說明。
 */
export async function checkAndGrantTaskCompletions(memberId: string, tasks: DailyTaskView[]): Promise<void> {
  const activeTasks = tasks.filter((t) => t.active);
  if (activeTasks.length === 0) return;

  const periodTasks = activeTasks.filter((t) => t.period !== "achievement");
  const achievementTasks = activeTasks.filter((t) => t.period === "achievement");

  const [completed, countsByPeriod, lifetimeCounts] = await Promise.all([
    listCompletedTaskPeriods(memberId),
    periodTasks.length > 0 ? getAllPeriodCounts(memberId) : Promise.resolve(null),
    achievementTasks.length > 0 ? getMemberLifetimeCounts(memberId) : Promise.resolve(null),
  ]);

  for (const task of periodTasks) {
    const count = countsByPeriod![task.period as PeriodType][task.type] ?? 0;
    if (count < task.targetCount) continue;
    const periodKey = periodStartTaiwan(task.period as PeriodType).toISOString();
    if (completed.has(`${task.id}:${periodKey}`)) continue;
    await grantTaskCompletion({ memberId, taskId: task.id, periodKey, expAwarded: task.rewardPoints });
  }

  for (const task of achievementTasks) {
    const count = lifetimeCounts![task.type] ?? 0;
    if (count < task.targetCount) continue;
    if (completed.has(`${task.id}:achievement`)) continue;
    await grantTaskCompletion({ memberId, taskId: task.id, periodKey: "achievement", expAwarded: task.rewardPoints });
  }
}
