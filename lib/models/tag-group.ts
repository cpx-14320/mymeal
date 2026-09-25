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
  return toView(doc);
}

export async function removeTagOption(id: string, option: string): Promise<TagGroupView | null> {
  await connectMongo();
  if (!Types.ObjectId.isValid(id)) throw new Error("無效的 id");
  const doc = await TagGroup.findByIdAndUpdate(
    id,
    { $pull: { options: option } },
    { returnDocument: "after" },
  );
  return doc ? toView(doc) : null;
}

export async function deleteTagGroup(id: string): Promise<boolean> {
  await connectMongo();
  if (!Types.ObjectId.isValid(id)) throw new Error("無效的 id");
  const result = await TagGroup.deleteOne({ _id: new Types.ObjectId(id) });
  return result.deletedCount > 0;
}
