import { Schema, model, models, Types } from "mongoose";
import { connectMongo } from "@/lib/mongoose";

/**
 * interstitial collection —— 蓋台廣告：前台進站時全螢幕蓋住畫面的廣告。
 * startAt/endAt 刻意存成 "YYYY-MM-DDTHH:mm" 字串（跟 <input type="datetime-local"> 同格式），
 * 不轉成 Date——排程判斷本來就是依使用者本機時間比對（見 interstitialStatus），
 * 存字串可以讓表單 defaultValue 直接對上，不用處理時區轉換。
 */
export type PromoFrequency = "always" | "daily" | "once";

export interface InterstitialDocument {
  _id: Types.ObjectId;
  name: string; // 只在後台顯示的名稱
  enabled: boolean;
  imageUrl: string;
  linkUrl?: string; // 空＝圖片不可點
  dismissSeconds: number; // 0＝不自動關，需手動
  frequency: PromoFrequency;
  startAt: string;
  endAt: string;
  createdAt: Date;
  updatedAt: Date;
}

const interstitialSchema = new Schema<InterstitialDocument>(
  {
    name: { type: String, required: true, trim: true },
    enabled: { type: Boolean, required: true, default: true },
    imageUrl: { type: String, default: "" },
    linkUrl: { type: String, default: "" },
    dismissSeconds: { type: Number, required: true, default: 8 },
    frequency: { type: String, enum: ["always", "daily", "once"], required: true, default: "daily" },
    startAt: { type: String, required: true },
    endAt: { type: String, required: true },
  },
  { timestamps: true, collection: "marketing_interstitials" },
);

export const Interstitial =
  models.Interstitial ?? model<InterstitialDocument>("Interstitial", interstitialSchema);

export interface InterstitialInput {
  name: string;
  enabled: boolean;
  imageUrl: string;
  linkUrl?: string;
  dismissSeconds: number;
  frequency: PromoFrequency;
  startAt: string;
  endAt: string;
}

export interface InterstitialView {
  id: string;
  name: string;
  enabled: boolean;
  imageUrl: string;
  linkUrl?: string;
  dismissSeconds: number;
  frequency: PromoFrequency;
  startAt: string;
  endAt: string;
}

function toView(d: InterstitialDocument): InterstitialView {
  return {
    id: String(d._id),
    name: d.name,
    enabled: d.enabled,
    imageUrl: d.imageUrl,
    linkUrl: d.linkUrl,
    dismissSeconds: d.dismissSeconds,
    frequency: d.frequency,
    startAt: d.startAt,
    endAt: d.endAt,
  };
}

const demoBanner =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="880" height="495"><rect width="880" height="495" fill="#b5730f"/><rect y="360" width="880" height="135" fill="#00000022"/><text x="60" y="170" font-family="system-ui,sans-serif" font-size="58" font-weight="700" fill="#ffffff">本週新開團</text><text x="60" y="240" font-family="system-ui,sans-serif" font-size="34" fill="#ffe9c9">下午茶專區・星巴克揪團上線</text><text x="60" y="430" font-family="system-ui,sans-serif" font-size="28" fill="#ffffff">點我看看 &#8594;</text></svg>`,
  );

/** 集合是空的才補一筆示範廣告，讓前台一開始就有東西可以展示。 */
async function seedIfEmpty() {
  if ((await Interstitial.countDocuments()) > 0) return;
  await Interstitial.create({
    name: "下午茶專區上線",
    enabled: true,
    imageUrl: demoBanner,
    linkUrl: "/menu",
    dismissSeconds: 8,
    frequency: "always",
    startAt: "2026-09-01T00:00",
    endAt: "2026-12-31T23:59",
  });
}

export async function listInterstitials(): Promise<InterstitialView[]> {
  await connectMongo();
  await seedIfEmpty();
  const docs = await Interstitial.find({}).sort({ createdAt: 1 });
  return docs.map(toView);
}

export async function findInterstitialById(id: string): Promise<InterstitialView | null> {
  await connectMongo();
  if (!Types.ObjectId.isValid(id)) return null;
  const doc = await Interstitial.findById(id);
  return doc ? toView(doc) : null;
}

export async function createInterstitial(input: InterstitialInput) {
  await connectMongo();
  const doc = await Interstitial.create(input);
  return { id: String(doc._id) };
}

export async function updateInterstitial(id: string, input: InterstitialInput) {
  await connectMongo();
  if (!Types.ObjectId.isValid(id)) throw new Error("無效的廣告 id");
  await Interstitial.findByIdAndUpdate(id, { $set: input });
}

export async function deleteInterstitial(id: string): Promise<boolean> {
  await connectMongo();
  if (!Types.ObjectId.isValid(id)) throw new Error("無效的廣告 id");
  const result = await Interstitial.deleteOne({ _id: new Types.ObjectId(id) });
  return result.deletedCount > 0;
}

export type InterstitialStatus = "showing" | "scheduled" | "ended" | "disabled";

export function interstitialStatus(a: InterstitialView, now: Date = new Date()): InterstitialStatus {
  if (!a.enabled) return "disabled";
  if (now < new Date(a.startAt)) return "scheduled";
  if (now > new Date(a.endAt)) return "ended";
  return "showing";
}

/** 前台蓋台廣告用：只要「開啟」就給候選（排程時間窗要依使用者本機時間判斷，留給前端算）。 */
export async function listEnabledInterstitials(): Promise<InterstitialView[]> {
  await connectMongo();
  await seedIfEmpty();
  const docs = await Interstitial.find({ enabled: true }).sort({ createdAt: 1 });
  return docs.map(toView);
}
