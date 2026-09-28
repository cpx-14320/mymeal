import { Schema, model, models, Types } from "mongoose";
import { connectMongo } from "@/lib/mongoose";
import "@/lib/models/catalog-item"; // 確保 populate("sections.itemIds"/其 pageId) 前 CatalogItem／Page model 一定已註冊
import "@/lib/models/item-category"; // 確保 populate("categoryId") 前 ItemCategory model 一定已註冊
import { getCreatorLabels, backfillCreatorMemberIds, type CreatorLabel } from "@/lib/models/creator";

export interface TemplateSection {
  _id: Types.ObjectId;
  name: string;
  itemIds: Types.ObjectId[]; // ref CatalogItem
}

/** menu_templates collection —— 一週菜單／一組飲料清單；sections 內嵌，順序有意義、不需要獨立查詢。
 *  categoryId 跟品項的「分類」共用同一份「類別設定」資料（見 item-category.ts），是模板整體掛的類別
 *  （例如便當／飲料），開團訂餐頁用來做分類篩選籤；跟 sections（模板內部的區塊，例如週一～週五，UI 上
 *  一律稱「區塊」）是兩回事，避免都叫「分類」造成混淆。選填——沒選就不會出現在開團訂餐頁的分類籤裡。 */
export interface TemplateDocument {
  _id: Types.ObjectId;
  name: string;
  categoryId?: Types.ObjectId; // ref ItemCategory
  sections: TemplateSection[];
  active: boolean;
  createdBy: string; // 建立者姓名快照；無登入會員時記「系統」
  createdByMemberId?: Types.ObjectId | null; // 建立者會員 id，用來查目前是否還有這項權限；null 代表補過但對不到人
  createdAt: Date;
  updatedAt: Date;
}

const templateSectionSchema = new Schema<TemplateSection>({
  name: { type: String, required: true, trim: true },
  itemIds: { type: [Schema.Types.ObjectId], ref: "CatalogItem", required: true, default: [] },
});

const templateSchema = new Schema<TemplateDocument>(
  {
    name: { type: String, required: true, trim: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "ItemCategory" },
    sections: { type: [templateSectionSchema], required: true, default: [] },
    active: { type: Boolean, required: true, default: true },
    createdBy: { type: String, required: true, trim: true, default: "系統" },
    createdByMemberId: { type: Schema.Types.ObjectId, ref: "Member" },
  },
  { timestamps: true, collection: "menu_templates" },
);

export const Template = models.Template ?? model<TemplateDocument>("Template", templateSchema);

export interface TemplateBasicInput {
  name: string;
  categoryId?: string;
}

interface PopulatedRef {
  _id: Types.ObjectId;
  name: string;
}

export interface TemplateListItem {
  id: string;
  name: string;
  categoryId?: string;
  categoryName: string;
  active: boolean;
  sections: { id: string; name: string; itemCount: number }[];
  createdBy: string;
  createdByMemberId?: string;
  /** 建立者現在的權限狀態——查得到才會有值，例如「已無此權限」「帳號已刪除」。 */
  createdByLabel?: CreatorLabel;
  createdAt: Date;
}

/** withCreatorLabels：只有模板設定清單頁（會顯示「建立者」欄）才需要開，理由同 listCatalogItems。 */
export async function listTemplates(options?: { withCreatorLabels?: boolean }): Promise<TemplateListItem[]> {
  await connectMongo();
  if (options?.withCreatorLabels) await backfillCreatorMemberIds(Template);
  const docs = await Template.find({})
    .sort({ createdAt: -1 })
    .populate<{ categoryId?: PopulatedRef }>("categoryId");
  const templates = docs.map((d) => {
    const category = d.categoryId as unknown as PopulatedRef | undefined;
    return {
      id: String(d._id),
      name: d.name,
      categoryId: category?._id ? String(category._id) : undefined,
      categoryName: category?.name ?? "",
      active: d.active,
      sections: d.sections.map((s: TemplateSection) => ({
        id: String(s._id),
        name: s.name,
        itemCount: s.itemIds.length,
      })),
      createdBy: d.createdBy,
      createdByMemberId: d.createdByMemberId ? String(d.createdByMemberId) : undefined,
      createdAt: d.createdAt,
    };
  });
  if (!options?.withCreatorLabels) return templates;

  const labels = await getCreatorLabels(
    templates.map((t) => t.createdByMemberId),
    "templates",
  );
  return templates.map((t) => ({
    ...t,
    createdByLabel: t.createdByMemberId ? labels.get(t.createdByMemberId) : undefined,
  }));
}

export interface TemplateSectionDetail {
  id: string;
  name: string;
  items: { id: string; name: string; emoji: string; imageUrl?: string; price: number; pageName?: string }[];
}

export interface TemplateDetail {
  id: string;
  name: string;
  categoryId?: string;
  categoryName: string;
  active: boolean;
  sections: TemplateSectionDetail[];
}

type PopulatedTemplateDoc = {
  _id: Types.ObjectId;
  name: string;
  categoryId?: PopulatedRef;
  active: boolean;
  sections: { _id: Types.ObjectId; name: string; itemIds: unknown }[];
};

function toTemplateDetail(doc: PopulatedTemplateDoc): TemplateDetail {
  const category = doc.categoryId as unknown as PopulatedRef | undefined;
  return {
    id: String(doc._id),
    name: doc.name,
    categoryId: category?._id ? String(category._id) : undefined,
    categoryName: category?.name ?? "",
    active: doc.active,
    sections: doc.sections.map((s) => ({
      id: String(s._id),
      name: s.name,
      items: (s.itemIds as unknown as Array<PopulatedRef & { emoji: string; imageUrl?: string; price: number; pageId?: PopulatedRef }>).map((it) => ({
        id: String(it._id),
        name: it.name,
        emoji: it.emoji,
        imageUrl: it.imageUrl,
        price: it.price,
        pageName: it.pageId?.name,
      })),
    })),
  };
}

export async function findTemplateById(id: string): Promise<TemplateDetail | null> {
  await connectMongo();
  if (!Types.ObjectId.isValid(id)) return null;
  const doc = await Template.findById(id)
    .populate<{ categoryId?: PopulatedRef }>("categoryId")
    .populate({
      path: "sections.itemIds",
      populate: { path: "pageId" },
    });
  if (!doc) return null;
  return toTemplateDetail(doc as unknown as PopulatedTemplateDoc);
}

/** 開團頁用：所有上架中的模板，含完整區塊/品項明細（給選模板後直接預覽當週菜單）。 */
export async function listActiveTemplateDetails(): Promise<TemplateDetail[]> {
  await connectMongo();
  const docs = await Template.find({ active: true })
    .sort({ createdAt: -1 })
    .populate<{ categoryId?: PopulatedRef }>("categoryId")
    .populate({
      path: "sections.itemIds",
      populate: { path: "pageId" },
    });
  return docs.map((d) => toTemplateDetail(d as unknown as PopulatedTemplateDoc));
}

/** 空字串／未選代表不分類，回傳 undefined；有帶值才驗證格式，格式不對才擋下。 */
function assertCategoryId(categoryId?: string) {
  if (!categoryId) return undefined;
  if (!Types.ObjectId.isValid(categoryId)) throw new Error("請選擇有效的分類。");
  return new Types.ObjectId(categoryId);
}

export async function createTemplate(
  input: TemplateBasicInput,
  createdBy?: string,
  createdByMemberId?: string,
) {
  await connectMongo();
  const doc = await Template.create({
    name: input.name,
    categoryId: assertCategoryId(input.categoryId),
    sections: [],
    active: true,
    createdBy: createdBy ?? "系統",
    createdByMemberId:
      createdByMemberId && Types.ObjectId.isValid(createdByMemberId)
        ? new Types.ObjectId(createdByMemberId)
        : undefined,
  });
  return { id: String(doc._id) };
}

export async function updateTemplateBasic(id: string, input: TemplateBasicInput) {
  await connectMongo();
  if (!Types.ObjectId.isValid(id)) throw new Error("無效的模板 id");

  const $set: Record<string, unknown> = { name: input.name };
  const $unset: Record<string, unknown> = {};
  // 呼叫端有帶 categoryId 這個 key（不管是不是空字串）才動分類欄位；完全沒帶就維持原值不動——
  // 目前唯一會呼叫這支的地方（編輯頁「基本資料」表單）已經不讓使用者改分類了，
  // 不能因此把既有的分類值也一起清空。
  if ("categoryId" in input) {
    const categoryId = assertCategoryId(input.categoryId);
    if (categoryId) $set.categoryId = categoryId;
    else $unset.categoryId = "";
  }

  return Template.findByIdAndUpdate(
    id,
    Object.keys($unset).length ? { $set, $unset } : { $set },
    { returnDocument: "after" },
  );
}

export async function setTemplatesActive(ids: string[], active: boolean): Promise<number> {
  await connectMongo();
  const objIds = ids.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id));
  if (objIds.length === 0) return 0;
  const result = await Template.updateMany({ _id: { $in: objIds } }, { $set: { active } });
  return result.modifiedCount;
}

export async function deleteTemplates(ids: string[]): Promise<number> {
  await connectMongo();
  const objIds = ids.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id));
  if (objIds.length === 0) return 0;

  const result = await Template.deleteMany({ _id: { $in: objIds } });
  return result.deletedCount;
}

export async function addTemplateSection(templateId: string, name: string) {
  await connectMongo();
  if (!Types.ObjectId.isValid(templateId)) throw new Error("無效的模板 id");
  const doc = await Template.findByIdAndUpdate(
    templateId,
    { $push: { sections: { name, itemIds: [] } } },
    { returnDocument: "after" },
  );
  if (!doc) throw new Error("找不到這個模板，可能已被刪除。");
  return doc;
}

export async function renameTemplateSection(templateId: string, sectionId: string, name: string) {
  await connectMongo();
  if (!Types.ObjectId.isValid(templateId) || !Types.ObjectId.isValid(sectionId)) {
    throw new Error("無效的 id");
  }
  const doc = await Template.findOneAndUpdate(
    { _id: templateId, "sections._id": sectionId },
    { $set: { "sections.$.name": name } },
    { returnDocument: "after" },
  );
  if (!doc) throw new Error("找不到這個區塊，可能已被刪除。");
  return doc;
}

export async function deleteTemplateSection(templateId: string, sectionId: string) {
  await connectMongo();
  if (!Types.ObjectId.isValid(templateId) || !Types.ObjectId.isValid(sectionId)) {
    throw new Error("無效的 id");
  }
  const doc = await Template.findByIdAndUpdate(
    templateId,
    { $pull: { sections: { _id: sectionId } } },
    { returnDocument: "after" },
  );
  if (!doc) throw new Error("找不到這個模板，可能已被刪除。");
  return doc;
}

export async function addItemToSection(templateId: string, sectionId: string, itemId: string) {
  await connectMongo();
  if (
    !Types.ObjectId.isValid(templateId) ||
    !Types.ObjectId.isValid(sectionId) ||
    !Types.ObjectId.isValid(itemId)
  ) {
    throw new Error("無效的 id");
  }
  const doc = await Template.findOneAndUpdate(
    { _id: templateId, "sections._id": sectionId },
    { $addToSet: { "sections.$.itemIds": new Types.ObjectId(itemId) } },
    { returnDocument: "after" },
  );
  if (!doc) throw new Error("找不到這個區塊，可能已被刪除。");
  return doc;
}

export async function removeItemFromSection(templateId: string, sectionId: string, itemId: string) {
  await connectMongo();
  if (
    !Types.ObjectId.isValid(templateId) ||
    !Types.ObjectId.isValid(sectionId) ||
    !Types.ObjectId.isValid(itemId)
  ) {
    throw new Error("無效的 id");
  }
  const doc = await Template.findOneAndUpdate(
    { _id: templateId, "sections._id": sectionId },
    { $pull: { "sections.$.itemIds": new Types.ObjectId(itemId) } },
    { returnDocument: "after" },
  );
  if (!doc) throw new Error("找不到這個區塊，可能已被刪除。");
  return doc;
}
