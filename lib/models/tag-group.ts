import { Schema, model, models, Types } from "mongoose";
import { connectMongo } from "@/lib/mongoose";

/** menu_tags collection —— 品項標籤群組（主食／肉類／飲食／甜度冰塊…）；options 內嵌，不拆表。 */
export interface TagGroupDocument {
  _id: Types.ObjectId;
  name: string;
  multi: boolean; // 可否複選
  options: string[];
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const tagGroupSchema = new Schema<TagGroupDocument>(
  {
    name: { type: String, required: true, trim: true },
    multi: { type: Boolean, required: true, default: false },
    options: { type: [String], required: true, default: [] },
    sortOrder: { type: Number, required: true, default: 0 },
  },
  { timestamps: true, collection: "menu_tag_groups" },
);

export const TagGroup = models.TagGroup ?? model<TagGroupDocument>("TagGroup", tagGroupSchema);

export interface TagGroupView {
  id: string;
  name: string;
  multi: boolean;
  options: string[];
}

function toView(d: { _id: Types.ObjectId; name: string; multi: boolean; options: string[] }): TagGroupView {
  return { id: String(d._id), name: d.name, multi: d.multi, options: d.options };
}

export async function listTagGroups(): Promise<TagGroupView[]> {
  await connectMongo();
  const docs = await TagGroup.find({}).sort({ sortOrder: 1, createdAt: 1 });
  return docs.map(toView);
}

export async function createTagGroup(name: string): Promise<TagGroupView> {
  await connectMongo();
  const count = await TagGroup.countDocuments();
  const doc = await TagGroup.create({ name, multi: true, options: [], sortOrder: count });
  return toView(doc);
}

/** 標籤群組卡片本身的拖曳排序，跟品項分類的 reorderItemCategories 同一套做法。 */
export async function reorderTagGroups(orderedIds: string[]): Promise<void> {
  await connectMongo();
  await TagGroup.bulkWrite(
    orderedIds.map((id, index) => ({
      updateOne: { filter: { _id: new Types.ObjectId(id) }, update: { $set: { sortOrder: index } } },
    })),
  );
}

/** 群組內選項的拖曳排序——options 是內嵌陣列，直接整組換成新順序；
 *  用「元素集合是否相同」把關，避免前端傳來跟現有選項對不上的資料把 options 換掉。 */
export async function reorderTagOptions(id: string, orderedOptions: string[]): Promise<TagGroupView | null> {
  await connectMongo();
  if (!Types.ObjectId.isValid(id)) throw new Error("無效的 id");
  const doc = await TagGroup.findById(id);
  if (!doc) return null;
  const current = [...doc.options].sort();
  const next = [...orderedOptions].sort();
  if (current.length !== next.length || current.some((v, i) => v !== next[i])) {
    throw new Error("選項清單跟現有資料不一致，請重新整理後再試。");
  }
  doc.options = orderedOptions;
  await doc.save();
  return toView(doc);
}

export async function renameTagGroup(id: string, name: string): Promise<TagGroupView | null> {
  await connectMongo();
  if (!Types.ObjectId.isValid(id)) throw new Error("無效的 id");
  const doc = await TagGroup.findByIdAndUpdate(id, { $set: { name } }, { returnDocument: "after" });
  return doc ? toView(doc) : null;
}

export async function setTagGroupMulti(id: string, multi: boolean): Promise<TagGroupView | null> {
  await connectMongo();
  if (!Types.ObjectId.isValid(id)) throw new Error("無效的 id");
  const doc = await TagGroup.findByIdAndUpdate(id, { $set: { multi } }, { returnDocument: "after" });
  return doc ? toView(doc) : null;
}

export async function addTagOption(id: string, option: string): Promise<TagGroupView | null> {
  await connectMongo();
  if (!Types.ObjectId.isValid(id)) throw new Error("無效的 id");
  const trimmed = option.trim();
  if (!trimmed) throw new Error("選項不能是空白。");
  const doc = await TagGroup.findByIdAndUpdate(
    id,
    { $addToSet: { options: trimmed } },
    { returnDocument: "after" },
  );
  return doc ? toView(doc) : null;
}

/** 改名/移除選項、砍整組時，選項字串（跟這個字串一樣的品項標籤）都要跟著 cascade 處理；
 *  但 tags 是純字串、不分群組，如果別的群組剛好也有一模一樣的選項字串，這個字串的品項
 *  也會被一起波及——呼叫端（後台介面）要先用這支查有沒有這個風險，讓管理者確認後再繼續。
 *  回傳值是 { 選項字串: 有用到它的其他群組名稱[] }，只列出真的有風險（非空陣列）的選項。 */
export async function findGroupsUsingOptions(
  excludeGroupId: string,
  options: string[],
): Promise<Record<string, string[]>> {
  await connectMongo();
  if (options.length === 0) return {};
  const docs = await TagGroup.find({ _id: { $ne: excludeGroupId }, options: { $in: options } }).select(
    "name options",
  );
  const result: Record<string, string[]> = {};
  for (const opt of options) {
    const names = docs.filter((d) => d.options.includes(opt)).map((d) => d.name);
    if (names.length > 0) result[opt] = names;
  }
  return result;
}

/** 改名同步套用到所有已經標記這個選項的品項——tags 是純字串陣列，直接把陣列裡等於
 *  舊字串的元素換成新字串（arrayFilters 只換命中的那個元素，其他標籤原樣保留）。 */
export async function renameTagOption(
  id: string,
  oldOption: string,
  newOption: string,
): Promise<TagGroupView | null> {
  await connectMongo();
  if (!Types.ObjectId.isValid(id)) throw new Error("無效的 id");
  const trimmed = newOption.trim();
  if (!trimmed) throw new Error("選項不能是空白。");
  const doc = await TagGroup.findById(id);
  if (!doc) return null;
  const idx = doc.options.indexOf(oldOption);
  if (idx === -1) throw new Error("找不到這個選項，可能已被刪除。");
  if (trimmed !== oldOption && doc.options.includes(trimmed)) throw new Error("這個選項名稱已經存在了。");
  doc.options[idx] = trimmed;
  await doc.save();

  const { CatalogItem } = await import("@/lib/models/catalog-item");
  await CatalogItem.updateMany(
    { tags: oldOption },
    { $set: { "tags.$[elem]": trimmed } },
    { arrayFilters: [{ elem: oldOption }] },
  );

  return toView(doc);
}

/** 移除選項同步從所有已經標記這個選項的品項的 tags 裡拿掉，不會留下孤兒標籤字串。 */
export async function removeTagOption(id: string, option: string): Promise<TagGroupView | null> {
  await connectMongo();
  if (!Types.ObjectId.isValid(id)) throw new Error("無效的 id");
  const doc = await TagGroup.findByIdAndUpdate(
    id,
    { $pull: { options: option } },
    { returnDocument: "after" },
  );
  if (!doc) return null;

  const { CatalogItem } = await import("@/lib/models/catalog-item");
  await CatalogItem.updateMany({ tags: option }, { $pull: { tags: option } });

  return toView(doc);
}

/** 刪除整組同步清掉所有已經標記這組任一選項的品項的 tags，不會留下孤兒標籤字串。 */
export async function deleteTagGroup(id: string): Promise<boolean> {
  await connectMongo();
  if (!Types.ObjectId.isValid(id)) throw new Error("無效的 id");
  const doc = await TagGroup.findById(id);
  if (!doc) return false;

  if (doc.options.length > 0) {
    const { CatalogItem } = await import("@/lib/models/catalog-item");
    await CatalogItem.updateMany({ tags: { $in: doc.options } }, { $pull: { tags: { $in: doc.options } } });
  }

  const result = await TagGroup.deleteOne({ _id: doc._id });
  return result.deletedCount > 0;
}
