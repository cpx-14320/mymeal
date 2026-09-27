import { Schema, model, models, Types } from "mongoose";
import { connectMongo } from "@/lib/mongoose";
import { getCreatorLabels, backfillCreatorMemberIds, type CreatorLabel } from "@/lib/models/creator";

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
  createdByMemberId?: Types.ObjectId | null; // 建立者會員 id，用來查目前是否還有這項權限；null 代表補過但對不到人
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
    createdByMemberId: { type: Schema.Types.ObjectId, ref: "Member" },
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
  createdByMemberId?: string;
  /** 建立者現在的權限狀態——查得到才會有值，例如「已無此權限」「帳號已刪除」；只有清單頁（listPages）會帶。 */
  createdByLabel?: CreatorLabel;
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
  createdByMemberId?: Types.ObjectId | null;
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
    createdByMemberId: d.createdByMemberId ? String(d.createdByMemberId) : undefined,
    updatedAt: d.updatedAt,
  };
}

function assertTemplateId(templateId?: string) {
  if (!templateId) return undefined;
  if (!Types.ObjectId.isValid(templateId)) throw new Error("請選擇有效的模板。");
  return new Types.ObjectId(templateId);
}

/** withCreatorLabels：只有頁面設定清單頁（會顯示「建立者」欄）才需要開——前台導覽用的
 *  listPages() 呼叫次數很多（每個前台頁面都會呼叫一次），不用多負擔這個查詢。 */
export async function listPages(options?: { withCreatorLabels?: boolean }): Promise<PageView[]> {
  await connectMongo();
  if (options?.withCreatorLabels) await backfillCreatorMemberIds(Page);
  const docs = await Page.find({}).sort({ sortOrder: 1, createdAt: 1 });
  const pages = docs.map(toView);
  if (!options?.withCreatorLabels) return pages;

  const labels = await getCreatorLabels(
    pages.map((p) => p.createdByMemberId),
    "pages",
  );
  return pages.map((p) => ({
    ...p,
    createdByLabel: p.createdByMemberId ? labels.get(p.createdByMemberId) : undefined,
  }));
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

export async function createPage(input: PageInput, createdBy?: string, createdByMemberId?: string) {
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
    createdByMemberId:
      createdByMemberId && Types.ObjectId.isValid(createdByMemberId)
        ? new Types.ObjectId(createdByMemberId)
        : undefined,
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

/** 刪除頁面時，同步把「指到這個頁面」的品項／模板的 pageId 拿掉（$unset，等同管理者自己選
 *  「取消掛頁面」），不留孤兒參照——跟刪除品項會自動清掉模板裡的引用是同一套精神。 */
export async function deletePages(ids: string[]): Promise<number> {
  await connectMongo();
  const objIds = ids.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id));
  if (objIds.length === 0) return 0;

  const { CatalogItem } = await import("@/lib/models/catalog-item");
  const { Template } = await import("@/lib/models/template");
  await Promise.all([
    CatalogItem.updateMany({ pageId: { $in: objIds } }, { $unset: { pageId: "" } }),
    Template.updateMany({ pageId: { $in: objIds } }, { $unset: { pageId: "" } }),
  ]);

  const result = await Page.deleteMany({ _id: { $in: objIds } });
  return result.deletedCount;
}
