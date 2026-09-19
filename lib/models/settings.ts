import { Schema, model, models, Types } from "mongoose";
import { connectMongo } from "@/lib/mongoose";

/**
 * system_settings collection —— 全站只有一筆設定文件（單例）；讀取時如果還沒有就用預設值建立一筆。
 * 「部門」清單原本在這裡是另一份純文字textarea，跟「部門與單位」頁的真實資料重複又互不相通，
 * 已經拿掉，部門一律以 org.ts 的 Department 為準。
 */
export interface SettingsDocument {
  _id: Types.ObjectId;
  orderDeadlineDefault: string;
  underMinPolicy: string;
  emailWhitelist: string;
  activationMethod: string;
  pickupLocations: string[];
  announcement: string;
  createdAt: Date;
  updatedAt: Date;
}

const settingsSchema = new Schema<SettingsDocument>(
  {
    orderDeadlineDefault: { type: String, required: true, default: "前一工作日 17:00" },
    underMinPolicy: { type: String, required: true, default: "自動取消並全額退款" },
    emailWhitelist: { type: String, required: true, default: "@company.com" },
    activationMethod: { type: String, required: true, default: "Email 驗證信自助開通" },
    pickupLocations: { type: [String], required: true, default: [] },
    announcement: { type: String, default: "", trim: true },
  },
  { timestamps: true, collection: "system_settings" },
);

export const Settings = models.Settings ?? model<SettingsDocument>("Settings", settingsSchema);

export interface SettingsView {
  orderDeadlineDefault: string;
  underMinPolicy: string;
  emailWhitelist: string;
  activationMethod: string;
  pickupLocations: string[];
  announcement: string;
  updatedAt: Date;
}

function toView(d: SettingsDocument): SettingsView {
  return {
    orderDeadlineDefault: d.orderDeadlineDefault,
    underMinPolicy: d.underMinPolicy,
    emailWhitelist: d.emailWhitelist,
    activationMethod: d.activationMethod,
    pickupLocations: d.pickupLocations,
    announcement: d.announcement,
    updatedAt: d.updatedAt,
  };
}

/** 全站只有一筆，沒有就用預設值建一筆。 */
export async function getSettings(): Promise<SettingsView> {
  await connectMongo();
  let doc = await Settings.findOne({});
  if (!doc) doc = await Settings.create({});
  return toView(doc);
}

export interface SettingsInput {
  orderDeadlineDefault: string;
  underMinPolicy: string;
  emailWhitelist: string;
  activationMethod: string;
  pickupLocations: string[];
  announcement: string;
}

export async function updateSettings(input: SettingsInput): Promise<SettingsView> {
  await connectMongo();
  const doc =
    (await Settings.findOneAndUpdate({}, { $set: input }, { new: true })) ??
    (await Settings.create(input));
  return toView(doc);
}

/** 給全站外框用：首頁/菜單頁上方公告 banner，沒設定就回傳空字串（前端不顯示）。 */
export async function getAnnouncement(): Promise<string> {
  const s = await getSettings();
  return s.announcement;
}
