import { Schema, model, models, Types } from "mongoose";
import { connectMongo } from "@/lib/mongoose";

/**
 * feedback collection —— 前台「意見回饋」表單送出的內容。訪客也能送出（previewMode 下
 * 前台頁面本來就不擋訪客瀏覽），有登入才會存 memberId；senderName 是寄件當下的姓名快照
 * （訪客記「訪客」），跟其他「建立者」欄位一樣不會因為會員後續改名/刪除而跟著變動。
 */
export type FeedbackType = "功能建議" | "操作問題" | "餐點 / 餐廳問題" | "錢包 / 儲值問題" | "其他";

export interface FeedbackDocument {
  _id: Types.ObjectId;
  type: FeedbackType;
  content: string;
  memberId?: Types.ObjectId; // ref Member；訪客送出時留空
  senderName: string; // 寄件者顯示名稱快照：登入會員的姓名，訪客則存「訪客」
  createdAt: Date;
  updatedAt: Date;
}

const feedbackSchema = new Schema<FeedbackDocument>(
  {
    type: {
      type: String,
      enum: ["功能建議", "操作問題", "餐點 / 餐廳問題", "錢包 / 儲值問題", "其他"],
      required: true,
      default: "其他",
    },
    content: { type: String, required: true, trim: true },
    memberId: { type: Schema.Types.ObjectId, ref: "Member" },
    senderName: { type: String, required: true, trim: true, default: "訪客" },
  },
  { timestamps: true, collection: "feedback" },
);

export const Feedback = models.Feedback ?? model<FeedbackDocument>("Feedback", feedbackSchema);

export interface FeedbackInput {
  type: FeedbackType;
  content: string;
  memberId?: string;
  senderName: string;
}

export interface FeedbackView {
  id: string;
  type: FeedbackType;
  content: string;
  senderName: string;
  createdAt: Date;
}

export async function createFeedback(input: FeedbackInput): Promise<{ id: string }> {
  await connectMongo();
  if (!input.content.trim()) throw new Error("請填寫意見內容。");
  const doc = await Feedback.create({
    type: input.type,
    content: input.content.trim(),
    memberId: input.memberId && Types.ObjectId.isValid(input.memberId) ? new Types.ObjectId(input.memberId) : undefined,
    senderName: input.senderName,
  });
  return { id: String(doc._id) };
}

/** 後台「意見列表」用：全部意見回饋，最新的在前面。 */
export async function listFeedback(): Promise<FeedbackView[]> {
  await connectMongo();
  const docs = await Feedback.find({}).sort({ createdAt: -1 });
  return docs.map((d) => ({
    id: String(d._id),
    type: d.type,
    content: d.content,
    senderName: d.senderName,
    createdAt: d.createdAt,
  }));
}

export async function deleteFeedback(ids: string[]): Promise<number> {
  await connectMongo();
  const objIds = ids.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id));
  if (objIds.length === 0) return 0;
  const result = await Feedback.deleteMany({ _id: { $in: objIds } });
  return result.deletedCount;
}
