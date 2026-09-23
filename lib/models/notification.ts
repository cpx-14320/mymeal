import { Schema, model, models, Types } from "mongoose";
import { connectMongo } from "@/lib/mongoose";

/**
 * notification collection —— 通知訊息：顯示在前台通知鈴鐺清單裡的短訊息。
 * 跟「蓋台廣告」（全螢幕彈窗，見 lib/models/interstitial.ts）是獨立的功能與資料，
 * 沒有排程時間窗，開啟就會出現在通知清單、關閉就從清單移除；已讀狀態存在使用者瀏覽器本機，不記在這裡。
 */
export interface NotificationDocument {
  _id: Types.ObjectId;
  title: string;
  message: string;
  linkUrl?: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<NotificationDocument>(
  {
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    linkUrl: { type: String, default: "" },
    enabled: { type: Boolean, required: true, default: true },
  },
  { timestamps: true, collection: "notification" },
);

export const Notification =
  models.Notification ?? model<NotificationDocument>("Notification", notificationSchema);

export interface NotificationInput {
  title: string;
  message: string;
  linkUrl?: string;
  enabled: boolean;
}

export interface NotificationView {
  id: string;
  title: string;
  message: string;
  linkUrl?: string;
  enabled: boolean;
  createdAt: string;
}

function toView(d: NotificationDocument): NotificationView {
  return {
    id: String(d._id),
    title: d.title,
    message: d.message,
    linkUrl: d.linkUrl,
    enabled: d.enabled,
    createdAt: d.createdAt.toISOString(),
  };
}

export async function listNotifications(): Promise<NotificationView[]> {
  await connectMongo();
  const docs = await Notification.find({}).sort({ createdAt: -1 });
  return docs.map(toView);
}

export async function findNotificationById(id: string): Promise<NotificationView | null> {
  await connectMongo();
  if (!Types.ObjectId.isValid(id)) return null;
  const doc = await Notification.findById(id);
  return doc ? toView(doc) : null;
}

export async function createNotification(input: NotificationInput) {
  await connectMongo();
  const doc = await Notification.create(input);
  return { id: String(doc._id) };
}

export async function updateNotification(id: string, input: NotificationInput) {
  await connectMongo();
  if (!Types.ObjectId.isValid(id)) throw new Error("無效的通知 id");
  await Notification.findByIdAndUpdate(id, { $set: input });
}

export async function deleteNotification(id: string): Promise<boolean> {
  await connectMongo();
  if (!Types.ObjectId.isValid(id)) throw new Error("無效的通知 id");
  const result = await Notification.deleteOne({ _id: new Types.ObjectId(id) });
  return result.deletedCount > 0;
}

export async function setNotificationsEnabled(ids: string[], enabled: boolean): Promise<number> {
  await connectMongo();
  const objIds = ids.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id));
  if (objIds.length === 0) return 0;
  const result = await Notification.updateMany({ _id: { $in: objIds } }, { $set: { enabled } });
  return result.modifiedCount;
}

/** 前台通知鈴鐺用：只回傳「開啟」的通知，最新的在前面。 */
export async function listEnabledNotifications(): Promise<NotificationView[]> {
  await connectMongo();
  const docs = await Notification.find({ enabled: true }).sort({ createdAt: -1 });
  return docs.map(toView);
}
