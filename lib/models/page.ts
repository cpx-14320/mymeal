import { Schema, model, models, Types } from "mongoose";
import { connectMongo } from "@/lib/mongoose";

/** page collection —— 前台導覽選單的訂購頁面（原本叫「店家」，本來只是「品項是誰做的」的標註，
 *  品項與模板不隸屬頁面）；前台網址：/pages/{slug}，所以額外加了選填的 templateId：
 *  指定的話這個頁面改顯示那個模板的內容（依 section 分組），不指定就維持原本
 *  「顯示這個頁面自己標註的品項」的行為，兩者互斥、不會疊加。 */
export interface PageDocument {
  _id: Types.ObjectId;
  name: string;
  description: string; // 側邊導覽名稱下方的說明文字，例如：便當、飲料、咖啡
  icon: string; // 側邊導覽名稱前面的圖示 emoji，留空則用預設圖示
  iconSvg: string; // 側邊導覽名稱前面的圖示，貼入完整 <svg>...</svg> 標記；有值優先於 icon emoji
  slug: string; // 前台網址代稱：/pages/{slug}
  sortOrder: number; // 前台顯示順序，數字小的排前面
  openInNewTab: boolean; // 前台連結點擊後是否另開新分頁
  showTopItems: boolean; // 這個頁面要不要顯示「熱門品項」輪播區塊
  templateId?: Types.ObjectId; // ref Template；有設定就整頁改顯示模板內容（分 section），取代頁面自己的品項
  active: boolean;
  createdBy: string; // 建立者姓名快照；無登入會員時記「系統」
  createdAt: Date;
  updatedAt: Date;
}

const pageSchema = new Schema<PageDocument>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    icon: { type: String, trim: true, default: "" },
    iconSvg: { type: String, trim: true, default: "" },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    sortOrder: { type: Number, required: true, default: 0 },
    openInNewTab: { type: Boolean, required: true, default: false },
    showTopItems: { type: Boolean, required: true, default: true },
    templateId: { type: Schema.Types.ObjectId, ref: "Template" },
    active: { type: Boolean, required: true, default: true },
    createdBy: { type: String, required: true, trim: true, default: "系統" },
  },
  { timestamps: true, collection: "menu_pages" },
);

export const Page = models.Page ?? model<PageDocument>("Page", pageSchema);

export interface PageInput {
  name: string;
  description?: string;
  icon?: string;
  iconSvg?: string;
  slug: string;
  sortOrder: number;
  openInNewTab: boolean;
  showTopItems: boolean;
  templateId?: string;
  active?: boolean;
}

export interface PageView {
  id: string;
  name: string;
  description: string;
  icon: string;
  iconSvg: string;
  slug: string;
  sortOrder: number;
  openInNewTab: boolean;
  showTopItems: boolean;
  templateId?: string;
  active: boolean;
  createdBy: string;
  updatedAt: Date;
}

function toView(d: {
  _id: Types.ObjectId;
  name: string;
  description: string;
  icon: string;
  iconSvg: string;
  slug: string;
  sortOrder: number;
  openInNewTab: boolean;
  showTopItems: boolean;
  templateId?: Types.ObjectId;
  active: boolean;
  createdBy: string;
  updatedAt: Date;
}): PageView {
  return {
    id: String(d._id),
    name: d.name,
    description: d.description,
    icon: d.icon,
    iconSvg: d.iconSvg,
    slug: d.slug,
    sortOrder: d.sortOrder,
    openInNewTab: d.openInNewTab,
    showTopItems: d.showTopItems,
    templateId: d.templateId ? String(d.templateId) : undefined,
    active: d.active,
    createdBy: d.createdBy,
    updatedAt: d.updatedAt,
  };
}

function assertTemplateId(templateId?: string) {
  if (!templateId) return undefined;
  if (!Types.ObjectId.isValid(templateId)) throw new Error("請選擇有效的模板。");
  return new Types.ObjectId(templateId);
}

export async function listPages(): Promise<PageView[]> {
  await connectMongo();
  const docs = await Page.find({}).sort({ sortOrder: 1, createdAt: 1 });
  return docs.map(toView);
}

export async function findPageById(id: string): Promise<PageView | null> {
  await connectMongo();
  if (!Types.ObjectId.isValid(id)) return null;
  const doc = await Page.findById(id);
  return doc ? toView(doc) : null;
}

export async function findPageBySlug(slug: string): Promise<PageView | null> {
  await connectMongo();
  const doc = await Page.findOne({ slug });
  return doc ? toView(doc) : null;
}

export async function createPage(input: PageInput, createdBy?: string) {
  await connectMongo();
  const existingName = await Page.findOne({ name: input.name });
  if (existingName) throw new Error("這個頁面名稱已經被使用了。");
  const existingSlug = await Page.findOne({ slug: input.slug });
  if (existingSlug) throw new Error("這個網址代稱已經被使用了。");
  const doc = await Page.create({
    name: input.name,
    description: input.description ?? "",
    icon: input.icon ?? "",
    iconSvg: input.iconSvg ?? "",
    slug: input.slug,
    sortOrder: input.sortOrder,
    openInNewTab: input.openInNewTab,
    showTopItems: input.showTopItems,
    templateId: assertTemplateId(input.templateId),
    active: input.active ?? true,
    createdBy: createdBy ?? "系統",
  });
  return toView(doc);
}

/** 編輯基本資料（名稱/說明/圖示/網址代稱/排序/開啟方式），不動 active——啟用/停用是獨立操作，見 setPagesActive。 */
export async function updatePage(id: string, input: PageInput) {
  await connectMongo();
  if (!Types.ObjectId.isValid(id)) throw new Error("無效的頁面 id");
  const existingName = await Page.findOne({ name: input.name, _id: { $ne: id } });
  if (existingName) throw new Error("這個頁面名稱已經被使用了。");
  const existingSlug = await Page.findOne({ slug: input.slug, _id: { $ne: id } });
  if (existingSlug) throw new Error("這個網址代稱已經被使用了。");
  const templateId = assertTemplateId(input.templateId);
  const doc = await Page.findByIdAndUpdate(
    id,
    {
      $set: {
        name: input.name,
        description: input.description ?? "",
        icon: input.icon ?? "",
        iconSvg: input.iconSvg ?? "",
        slug: input.slug,
        sortOrder: input.sortOrder,
        openInNewTab: input.openInNewTab,
        showTopItems: input.showTopItems,
        ...(templateId ? { templateId } : {}),
      },
      ...(templateId ? {} : { $unset: { templateId: "" } }),
    },
    { returnDocument: "after" },
  );
  return doc;
}

export async function setPagesActive(ids: string[], active: boolean): Promise<number> {
  await connectMongo();
  const objIds = ids.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id));
  if (objIds.length === 0) return 0;
  const result = await Page.updateMany({ _id: { $in: objIds } }, { $set: { active } });
  return result.modifiedCount;
}

export async function deletePages(ids: string[]): Promise<number> {
  await connectMongo();
  const objIds = ids.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id));
  if (objIds.length === 0) return 0;
  const result = await Page.deleteMany({ _id: { $in: objIds } });
  return result.deletedCount;
}
