import { Schema, model, models, Types } from "mongoose";
import { connectMongo } from "@/lib/mongoose";

/** site_settings collection —— 全站層級、只會有一筆的小設定（_id 固定用 "singleton"）。
 *  目前只存「首頁菜單預覽要顯示哪個模板」，之後陸續有其他全站設定可以直接加欄位進來，
 *  不用每加一個設定就多開一個 collection。 */
export interface SiteSettingsDocument {
  _id: string;
  homePreviewTemplateId?: Types.ObjectId; // ref Template；沒設定就顯示首頁內建的範例假資料
}

const siteSettingsSchema = new Schema<SiteSettingsDocument>(
  {
    _id: { type: String, required: true },
    homePreviewTemplateId: { type: Schema.Types.ObjectId, ref: "Template" },
  },
  { collection: "site_settings" },
);

export const SiteSettings =
  models.SiteSettings ?? model<SiteSettingsDocument>("SiteSettings", siteSettingsSchema);

const SINGLETON_ID = "singleton";

export async function getHomePreviewTemplateId(): Promise<string | undefined> {
  await connectMongo();
  const doc = await SiteSettings.findById(SINGLETON_ID);
  return doc?.homePreviewTemplateId ? String(doc.homePreviewTemplateId) : undefined;
}

export async function setHomePreviewTemplateId(templateId: string | null): Promise<void> {
  await connectMongo();
  if (templateId && Types.ObjectId.isValid(templateId)) {
    await SiteSettings.findByIdAndUpdate(
      SINGLETON_ID,
      { $set: { homePreviewTemplateId: new Types.ObjectId(templateId) } },
      { upsert: true },
    );
  } else {
    await SiteSettings.findByIdAndUpdate(
      SINGLETON_ID,
      { $unset: { homePreviewTemplateId: "" } },
      { upsert: true },
    );
  }
}
