import { Schema, model, models, Types } from "mongoose";
import { connectMongo } from "@/lib/mongoose";

/** site_settings collection —— 全站層級、只會有一筆的小設定（_id 固定用 "singleton"）。
 *  目前只存「首頁菜單預覽要顯示哪個模板／哪個區塊」，之後陸續有其他全站設定可以直接加欄位
 *  進來，不用每加一個設定就多開一個 collection。 */
export interface SiteSettingsDocument {
  _id: string;
  homePreviewTemplateId?: Types.ObjectId; // ref Template；沒設定就顯示首頁內建的範例假資料
  homePreviewSectionId?: Types.ObjectId; // 該模板底下指定一個區塊；沒指定就混合該模板全部區塊的品項
}

const siteSettingsSchema = new Schema<SiteSettingsDocument>(
  {
    _id: { type: String, required: true },
    homePreviewTemplateId: { type: Schema.Types.ObjectId, ref: "Template" },
    homePreviewSectionId: { type: Schema.Types.ObjectId },
  },
  { collection: "site_settings" },
);

export const SiteSettings =
  models.SiteSettings ?? model<SiteSettingsDocument>("SiteSettings", siteSettingsSchema);

const SINGLETON_ID = "singleton";

export interface HomePreviewConfig {
  templateId?: string;
  sectionId?: string;
}

export async function getHomePreviewConfig(): Promise<HomePreviewConfig> {
  await connectMongo();
  const doc = await SiteSettings.findById(SINGLETON_ID);
  return {
    templateId: doc?.homePreviewTemplateId ? String(doc.homePreviewTemplateId) : undefined,
    sectionId: doc?.homePreviewSectionId ? String(doc.homePreviewSectionId) : undefined,
  };
}

/** sectionId 沒帶（或跟這個模板對不上）就代表「混合這個模板全部區塊」；templateId 清空時
 *  sectionId 一併清空，不會留著一個沒有模板可對應的孤兒設定。 */
export async function setHomePreviewConfig(config: HomePreviewConfig): Promise<void> {
  await connectMongo();
  const templateId =
    config.templateId && Types.ObjectId.isValid(config.templateId) ? config.templateId : null;
  const sectionId =
    templateId && config.sectionId && Types.ObjectId.isValid(config.sectionId)
      ? config.sectionId
      : null;

  const $set: Record<string, unknown> = {};
  const $unset: Record<string, unknown> = {};
  if (templateId) $set.homePreviewTemplateId = new Types.ObjectId(templateId);
  else $unset.homePreviewTemplateId = "";
  if (sectionId) $set.homePreviewSectionId = new Types.ObjectId(sectionId);
  else $unset.homePreviewSectionId = "";

  const update: Record<string, unknown> = {};
  if (Object.keys($set).length > 0) update.$set = $set;
  if (Object.keys($unset).length > 0) update.$unset = $unset;

  await SiteSettings.findByIdAndUpdate(SINGLETON_ID, update, { upsert: true });
}
