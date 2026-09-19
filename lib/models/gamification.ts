import { Schema, model, models, Types } from "mongoose";
import { connectMongo } from "@/lib/mongoose";

/**
 * daily_task / exp_rule / member_level collections —— 任務／經驗值／等級，三張後台設定表。
 * 會員實際的 exp／任務進度目前還是從 lib/mock.ts 的假訂單/儲值/評分數量換算出來
 * （見 memberExp／memberTaskProgress），因為還沒有真的活動歷程可以算；
 * 這裡只負責讓「設定」本身是真資料，能新增/編輯/刪除任務、規則、等級。
 * 集合是空的才會種入原本寫死的預設值，跟 org.ts 的 seedIfEmpty 同一套做法。
 */

export type TaskType = "topup" | "order" | "favorite" | "comment" | "rating";
export const taskTypeLabel: Record<TaskType, string> = {
  topup: "儲值",
  order: "訂餐",
  favorite: "收藏",
  comment: "留言",
  rating: "評分",
};
const TASK_TYPES: TaskType[] = ["topup", "order", "favorite", "comment", "rating"];

export type TaskPeriod = "daily" | "weekly" | "monthly";
export const taskPeriodLabel: Record<TaskPeriod, string> = { daily: "每日", weekly: "每週", monthly: "每月" };
const TASK_PERIODS: TaskPeriod[] = ["daily", "weekly", "monthly"];

const DUPLICATE_KEY_ERROR = 11000;
function isDuplicateKeyError(err: unknown): boolean {
  return !!err && typeof err === "object" && "code" in err && err.code === DUPLICATE_KEY_ERROR;
}

async function seedIfEmpty<T>(
  Model: { countDocuments: () => Promise<number>; insertMany: (docs: T[], opts: { ordered: boolean }) => Promise<unknown> },
  docs: T[],
) {
  if ((await Model.countDocuments()) > 0) return;
  try {
    await Model.insertMany(docs, { ordered: false });
  } catch (err) {
    if (!isDuplicateKeyError(err)) throw err;
  }
}

/* ── 任務 ── */

export interface DailyTaskDocument {
  _id: Types.ObjectId;
  name: string;
  type: TaskType;
  period: TaskPeriod;
  targetCount: number;
  rewardPoints: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const dailyTaskSchema = new Schema<DailyTaskDocument>(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: TASK_TYPES, required: true },
    period: { type: String, enum: TASK_PERIODS, required: true },
    targetCount: { type: Number, required: true, default: 1 },
    rewardPoints: { type: Number, required: true, default: 10 },
    active: { type: Boolean, required: true, default: true },
  },
  { timestamps: true, collection: "gamification_daily_tasks" },
);

export const DailyTask = models.DailyTask ?? model<DailyTaskDocument>("DailyTask", dailyTaskSchema);

const DEFAULT_TASKS = [
  { name: "每日訂餐", type: "order" as TaskType, period: "daily" as TaskPeriod, targetCount: 1, rewardPoints: 10, active: true },
  { name: "每週訂餐", type: "order" as TaskType, period: "weekly" as TaskPeriod, targetCount: 4, rewardPoints: 20, active: true },
  { name: "每週儲值", type: "topup" as TaskType, period: "weekly" as TaskPeriod, targetCount: 1, rewardPoints: 10, active: true },
  { name: "每月評分", type: "rating" as TaskType, period: "monthly" as TaskPeriod, targetCount: 5, rewardPoints: 15, active: true },
  { name: "每月留言", type: "comment" as TaskType, period: "monthly" as TaskPeriod, targetCount: 3, rewardPoints: 10, active: false },
];

export interface DailyTaskView {
  id: string;
  name: string;
  type: TaskType;
  period: TaskPeriod;
  targetCount: number;
  rewardPoints: number;
  active: boolean;
}

function toTaskView(d: DailyTaskDocument): DailyTaskView {
  return {
    id: String(d._id),
    name: d.name,
    type: d.type,
    period: d.period,
    targetCount: d.targetCount,
    rewardPoints: d.rewardPoints,
    active: d.active,
  };
}

export async function listDailyTasks(): Promise<DailyTaskView[]> {
  await connectMongo();
  await seedIfEmpty(DailyTask, DEFAULT_TASKS);
  const docs = await DailyTask.find({}).sort({ createdAt: 1 });
  return docs.map(toTaskView);
}

export async function createDailyTask(): Promise<DailyTaskView> {
  await connectMongo();
  const doc = await DailyTask.create({ name: "新任務", type: "order", period: "daily", targetCount: 1, rewardPoints: 10, active: true });
  return toTaskView(doc);
}

export interface DailyTaskPatch {
  name?: string;
  type?: TaskType;
  period?: TaskPeriod;
  targetCount?: number;
  rewardPoints?: number;
  active?: boolean;
}

export async function updateDailyTask(id: string, patch: DailyTaskPatch) {
  await connectMongo();
  if (!Types.ObjectId.isValid(id)) throw new Error("無效的任務 id");
  await DailyTask.findByIdAndUpdate(id, { $set: patch });
}

export async function deleteDailyTask(id: string) {
  await connectMongo();
  if (!Types.ObjectId.isValid(id)) throw new Error("無效的任務 id");
  await DailyTask.deleteOne({ _id: new Types.ObjectId(id) });
}

/* ── 經驗值規則 ── */

export interface ExpRuleDocument {
  _id: Types.ObjectId;
  type: TaskType;
  expPerAction: number;
  dailyLimit: number | null;
  weeklyLimit: number | null;
  monthlyLimit: number | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const expRuleSchema = new Schema<ExpRuleDocument>(
  {
    type: { type: String, enum: TASK_TYPES, required: true },
    expPerAction: { type: Number, required: true, default: 1 },
    dailyLimit: { type: Number, default: null },
    weeklyLimit: { type: Number, default: null },
    monthlyLimit: { type: Number, default: null },
    active: { type: Boolean, required: true, default: true },
  },
  { timestamps: true, collection: "gamification_exp_rules" },
);

export const ExpRule = models.ExpRule ?? model<ExpRuleDocument>("ExpRule", expRuleSchema);

const DEFAULT_EXP_RULES = [
  { type: "order" as TaskType, expPerAction: 5, dailyLimit: 10, weeklyLimit: 40, monthlyLimit: null, active: true },
  { type: "topup" as TaskType, expPerAction: 10, dailyLimit: 10, weeklyLimit: 20, monthlyLimit: 60, active: true },
  { type: "rating" as TaskType, expPerAction: 3, dailyLimit: 6, weeklyLimit: null, monthlyLimit: null, active: true },
  { type: "comment" as TaskType, expPerAction: 3, dailyLimit: 6, weeklyLimit: null, monthlyLimit: null, active: true },
  { type: "favorite" as TaskType, expPerAction: 1, dailyLimit: 5, weeklyLimit: null, monthlyLimit: null, active: true },
];

export interface ExpRuleView {
  id: string;
  type: TaskType;
  expPerAction: number;
  dailyLimit: number | null;
  weeklyLimit: number | null;
  monthlyLimit: number | null;
  active: boolean;
}

function toExpRuleView(d: ExpRuleDocument): ExpRuleView {
  return {
    id: String(d._id),
    type: d.type,
    expPerAction: d.expPerAction,
    dailyLimit: d.dailyLimit,
    weeklyLimit: d.weeklyLimit,
    monthlyLimit: d.monthlyLimit,
    active: d.active,
  };
}

export async function listExpRules(): Promise<ExpRuleView[]> {
  await connectMongo();
  await seedIfEmpty(ExpRule, DEFAULT_EXP_RULES);
  const docs = await ExpRule.find({}).sort({ createdAt: 1 });
  return docs.map(toExpRuleView);
}

export async function createExpRule(): Promise<ExpRuleView> {
  await connectMongo();
  const doc = await ExpRule.create({ type: "order", expPerAction: 1, active: true });
  return toExpRuleView(doc);
}

export interface ExpRulePatch {
  type?: TaskType;
  expPerAction?: number;
  dailyLimit?: number | null;
  weeklyLimit?: number | null;
  monthlyLimit?: number | null;
  active?: boolean;
}

export async function updateExpRule(id: string, patch: ExpRulePatch) {
  await connectMongo();
  if (!Types.ObjectId.isValid(id)) throw new Error("無效的規則 id");
  await ExpRule.findByIdAndUpdate(id, { $set: patch });
}

export async function deleteExpRule(id: string) {
  await connectMongo();
  if (!Types.ObjectId.isValid(id)) throw new Error("無效的規則 id");
  await ExpRule.deleteOne({ _id: new Types.ObjectId(id) });
}

/* ── 等級 ── */

export interface MemberLevelDocument {
  _id: Types.ObjectId;
  name: string;
  minExp: number;
  createdAt: Date;
  updatedAt: Date;
}

const memberLevelSchema = new Schema<MemberLevelDocument>(
  {
    name: { type: String, required: true, trim: true },
    minExp: { type: Number, required: true, default: 0 },
  },
  { timestamps: true, collection: "gamification_member_levels" },
);

export const MemberLevel = models.MemberLevel ?? model<MemberLevelDocument>("MemberLevel", memberLevelSchema);

const DEFAULT_LEVELS = [
  { name: "新手", minExp: 0 },
  { name: "常客", minExp: 300 },
  { name: "熟客", minExp: 700 },
  { name: "達人", minExp: 1500 },
  { name: "傳說", minExp: 3000 },
];

export interface MemberLevelView {
  id: string;
  name: string;
  minExp: number;
}

function toLevelView(d: MemberLevelDocument): MemberLevelView {
  return { id: String(d._id), name: d.name, minExp: d.minExp };
}

export async function listMemberLevels(): Promise<MemberLevelView[]> {
  await connectMongo();
  await seedIfEmpty(MemberLevel, DEFAULT_LEVELS);
  const docs = await MemberLevel.find({}).sort({ minExp: 1 });
  return docs.map(toLevelView);
}

export async function createMemberLevel(): Promise<MemberLevelView> {
  await connectMongo();
  const highest = await MemberLevel.findOne({}).sort({ minExp: -1 });
  const doc = await MemberLevel.create({ name: "新等級", minExp: (highest?.minExp ?? 0) + 100 });
  return toLevelView(doc);
}

export async function updateMemberLevel(id: string, patch: { name?: string; minExp?: number }) {
  await connectMongo();
  if (!Types.ObjectId.isValid(id)) throw new Error("無效的等級 id");
  await MemberLevel.findByIdAndUpdate(id, { $set: patch });
}

export async function deleteMemberLevel(id: string) {
  await connectMongo();
  if (!Types.ObjectId.isValid(id)) throw new Error("無效的等級 id");
  await MemberLevel.deleteOne({ _id: new Types.ObjectId(id) });
}
