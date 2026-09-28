import { Schema, model, models, Types } from "mongoose";
import { connectMongo } from "@/lib/mongoose";

const DUPLICATE_KEY_ERROR = 11000;

/**
 * gamification_task_completions collection —— 記錄「這位會員在這個任務的這個週期／成就裡，
 * 已經達標並發過一次性完成獎勵 exp」，(memberId, taskId, periodKey) 唯一一筆。
 * periodKey：週期任務（daily/weekly/monthly）用 periodStartTaiwan() 那個週期起始時間的 ISO
 * 字串，等於「這是哪一天/哪一週/哪一個月」的身分證；成就任務固定用 "achievement"（沒有週期
 * 概念，一輩子只會完成一次）。
 * 一旦寫入就永久保留：之後不論這個週期是否已經結束、或構成這次達標的行為被取消／撤銷，都不會
 * 回頭刪除或改寫這筆紀錄——見 lib/models/achievements.ts 的 checkAndGrantTaskCompletions 說明。
 * expAwarded 存的是「發放當下」任務設定的 rewardPoints 快照，之後管理員改任務的獎勵 exp
 * 不會讓這筆已經發出去的紀錄跟著變動。
 */
export interface TaskCompletionDocument {
  _id: Types.ObjectId;
  memberId: Types.ObjectId; // ref Member
  taskId: Types.ObjectId; // ref DailyTask
  periodKey: string;
  expAwarded: number;
  completedAt: Date;
}

const taskCompletionSchema = new Schema<TaskCompletionDocument>(
  {
    memberId: { type: Schema.Types.ObjectId, ref: "Member", required: true },
    taskId: { type: Schema.Types.ObjectId, ref: "DailyTask", required: true },
    periodKey: { type: String, required: true },
    expAwarded: { type: Number, required: true },
    completedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: false, collection: "gamification_task_completions" },
);
taskCompletionSchema.index({ memberId: 1, taskId: 1, periodKey: 1 }, { unique: true });

export const TaskCompletion =
  models.TaskCompletion ?? model<TaskCompletionDocument>("TaskCompletion", taskCompletionSchema);

/** 這位會員目前所有「已經發放」的任務完成獎勵 exp 加總——永久累加，不受週期重置或後續行為
 *  被取消／撤銷影響（見上面 collection 說明）。 */
export async function getMemberTaskCompletionBonusExp(memberId: string): Promise<number> {
  await connectMongo();
  if (!Types.ObjectId.isValid(memberId)) return 0;
  const rows = await TaskCompletion.aggregate<{ total: number }>([
    { $match: { memberId: new Types.ObjectId(memberId) } },
    { $group: { _id: null, total: { $sum: "$expAwarded" } } },
  ]);
  return rows[0]?.total ?? 0;
}

/** 這位會員已經拿過完成獎勵的 (taskId, periodKey) 組合，用來判斷某個任務的某個週期是否已經
 *  發過，避免同一個週期重複發獎勵。 */
export async function listCompletedTaskPeriods(memberId: string): Promise<Set<string>> {
  await connectMongo();
  if (!Types.ObjectId.isValid(memberId)) return new Set();
  const rows = await TaskCompletion.find({ memberId: new Types.ObjectId(memberId) }, { taskId: 1, periodKey: 1 });
  return new Set(rows.map((r) => `${r.taskId}:${r.periodKey}`));
}

/** 寫入一筆完成紀錄；(memberId, taskId, periodKey) 已經存在就略過——靠 unique index 保證，
 *  用 try/catch 吃掉重複鍵錯誤，同時間多次呼叫（例如同一頁面多個地方觸發檢查）也不會炸掉。 */
export async function grantTaskCompletion(input: {
  memberId: string;
  taskId: string;
  periodKey: string;
  expAwarded: number;
}): Promise<void> {
  await connectMongo();
  try {
    await TaskCompletion.create({
      memberId: new Types.ObjectId(input.memberId),
      taskId: new Types.ObjectId(input.taskId),
      periodKey: input.periodKey,
      expAwarded: input.expAwarded,
    });
  } catch (err) {
    const isDuplicate = !!err && typeof err === "object" && "code" in err && err.code === DUPLICATE_KEY_ERROR;
    if (!isDuplicate) throw err;
  }
}
