import { Schema, model, models, Types } from "mongoose";
import { connectMongo } from "@/lib/mongoose";
import "@/lib/models/catalog-item"; // 確保 populate("pageId"/"sections.itemIds") 前 Page／CatalogItem model 一定已註冊
import "@/lib/models/item-category"; // 確保 populate("categoryId") 前 ItemCategory model 一定已註冊

export interface TemplateSection {
  _id: Types.ObjectId;
  name: string;
  itemIds: Types.ObjectId[]; // ref CatalogItem
}

/** menu_templates collection —— 一週菜單／一組飲料清單；sections 內嵌，順序有意義、不需要獨立查詢。
 *  categoryId 跟品項的「分類」共用同一份「類別設定」資料（見 item-category.ts）。 */
export interface TemplateDocument {
  _id: Types.ObjectId;
  name: string;
  categoryId: Types.ObjectId; // ref ItemCategory
  pageId?: Types.ObjectId; // ref Page
  sections: TemplateSection[];
  active: boolean;
  createdBy: string; // 建立者姓名快照；無登入會員時記「系統」
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
    categoryId: { type: Schema.Types.ObjectId, ref: "ItemCategory", required: true },
    pageId: { type: Schema.Types.ObjectId, ref: "Page" },
    sections: { type: [templateSectionSchema], required: true, default: [] },
    active: { type: Boolean, required: true, default: true },
    createdBy: { type: String, required: true, trim: true, default: "系統" },
  },
  { timestamps: true, collection: "menu_templates" },
);

export const Template = models.Template ?? model<TemplateDocument>("Template", templateSchema);

export interface TemplateBasicInput {
  name: string;
  categoryId: string;
  pageId?: string;
}

interface PopulatedRef {
  _id: Types.ObjectId;
  name: string;
}

export interface TemplateListItem {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  pageId?: string;
  pageName?: string;
  active: boolean;
  sections: { id: string; name: string; itemCount: number }[];
  createdBy: string;
  createdAt: Date;
}

export async function listTemplates(): Promise<TemplateListItem[]> {
  await connectMongo();
  const docs = await Template.find({})
    .sort({ createdAt: -1 })
    .populate<{ pageId?: PopulatedRef; categoryId: PopulatedRef }>(["pageId", "categoryId"]);
  return docs.map((d) => {
    const page = d.pageId as unknown as PopulatedRef | undefined;
    const category = d.categoryId as unknown as PopulatedRef;
    return {
      id: String(d._id),
      name: d.name,
      categoryId: String(category?._id ?? d.categoryId),
      categoryName: category?.name ?? "",
      pageId: page?._id ? String(page._id) : undefined,
      pageName: page?.name,
      active: d.active,
      sections: d.sections.map((s: TemplateSection) => ({
        id: String(s._id),
        name: s.name,
        itemCount: s.itemIds.length,
      })),
      createdBy: d.createdBy,
      createdAt: d.createdAt,
    };
  });
}

export interface TemplateSectionDetail {
  id: string;
  name: string;
  items: { id: string; name: string; emoji: string; imageUrl?: string; price: number; pageName?: string }[];
}

export interface TemplateDetail {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  pageId?: string;
  pageName?: string;
  active: boolean;
  sections: TemplateSectionDetail[];
}

type PopulatedTemplateDoc = {
  _id: Types.ObjectId;
  name: string;
  categoryId: PopulatedRef;
  active: boolean;
  pageId?: PopulatedRef;
  sections: { _id: Types.ObjectId; name: string; itemIds: unknown }[];
};

function toTemplateDetail(doc: PopulatedTemplateDoc): TemplateDetail {
  const page = doc.pageId as unknown as PopulatedRef | undefined;
  const category = doc.categoryId as unknown as PopulatedRef;
  return {
    id: String(doc._id),
    name: doc.name,
    categoryId: String(category?._id ?? doc.categoryId),
    categoryName: category?.name ?? "",
    pageId: page?._id ? String(page._id) : undefined,
    pageName: page?.name,
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
    .populate<{ pageId?: PopulatedRef; categoryId: PopulatedRef }>(["pageId", "categoryId"])
    .populate({
      path: "sections.itemIds",
      populate: { path: "pageId" },
    });
  if (!doc) return null;
  return toTemplateDetail(doc as unknown as PopulatedTemplateDoc);
}

/** 開團頁用：所有上架中的模板，含完整分類/品項明細（給選模板後直接預覽當週菜單）。 */
export async function listActiveTemplateDetails(): Promise<TemplateDetail[]> {
  await connectMongo();
  const docs = await Template.find({ active: true })
    .sort({ createdAt: -1 })
    .populate<{ pageId?: PopulatedRef; categoryId: PopulatedRef }>(["pageId", "categoryId"])
    .populate({
      path: "sections.itemIds",
      populate: { path: "pageId" },
    });
  return docs.map((d) => toTemplateDetail(d as unknown as PopulatedTemplateDoc));
}

function assertPageId(pageId?: string) {
  if (pageId && !Types.ObjectId.isValid(pageId)) throw new Error("請選擇有效的頁面。");
  return pageId ? new Types.ObjectId(pageId) : undefined;
}

function assertCategoryId(categoryId: string) {
  if (!Types.ObjectId.isValid(categoryId)) throw new Error("請選擇有效的分類。");
  return new Types.ObjectId(categoryId);
}

export async function createTemplate(input: TemplateBasicInput, createdBy?: string) {
  await connectMongo();
  const doc = await Template.create({
    name: input.name,
    categoryId: assertCategoryId(input.categoryId),
    pageId: assertPageId(input.pageId),
    sections: [],
    active: true,
    createdBy: createdBy ?? "系統",
  });
  return { id: String(doc._id) };
}

export async function updateTemplateBasic(id: string, input: TemplateBasicInput) {
  await connectMongo();
  if (!Types.ObjectId.isValid(id)) throw new Error("無效的模板 id");
  return Template.findByIdAndUpdate(
    id,
    { $set: { name: input.name, categoryId: assertCategoryId(input.categoryId), pageId: assertPageId(input.pageId) } },
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

  const { OrderZone } = await import("@/lib/models/order-zone");
  await OrderZone.updateMany(
    { templateIds: { $in: objIds } },
    { $pull: { templateIds: { $in: objIds } } },
  );

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
  if (!doc) throw new Error("找不到這個分類，可能已被刪除。");
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
  if (!doc) throw new Error("找不到這個分類，可能已被刪除。");
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
  if (!doc) throw new Error("找不到這個分類，可能已被刪除。");
  return doc;
}
