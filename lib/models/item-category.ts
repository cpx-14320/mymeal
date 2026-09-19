import { Schema, model, models, Types } from "mongoose";
import { connectMongo } from "@/lib/mongoose";

/** menu_categories collection —— 品項分類（便當／餐盒…），跟「標籤」與「模板分類（星期幾）」不同。 */
export interface ItemCategoryDocument {
  _id: Types.ObjectId;
  name: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const itemCategorySchema = new Schema<ItemCategoryDocument>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    sortOrder: { type: Number, required: true, default: 0 },
  },
  { timestamps: true, collection: "menu_item_categories" },
);

export const ItemCategory =
  models.ItemCategory ?? model<ItemCategoryDocument>("ItemCategory", itemCategorySchema);

export interface ItemCategoryOption {
  id: string;
  name: string;
}

export async function listItemCategories(): Promise<ItemCategoryOption[]> {
  await connectMongo();
  const docs = await ItemCategory.find({}).sort({ sortOrder: 1, createdAt: 1 });
  return docs.map((d) => ({ id: String(d._id), name: d.name }));
}

export async function createItemCategory(name: string): Promise<ItemCategoryOption> {
  await connectMongo();
  const existing = await ItemCategory.findOne({ name });
  if (existing) throw new Error("這個分類名稱已經存在了。");
  const count = await ItemCategory.countDocuments();
  const doc = await ItemCategory.create({ name, sortOrder: count });
  return { id: String(doc._id), name: doc.name };
}

export async function updateItemCategory(id: string, name: string): Promise<ItemCategoryOption> {
  await connectMongo();
  if (!Types.ObjectId.isValid(id)) throw new Error("無效的 id");
  const current = await ItemCategory.findById(id);
  if (!current) throw new Error("找不到這筆資料，可能已被刪除。");
  if (current.name === name) return { id, name };

  const existing = await ItemCategory.findOne({ name, _id: { $ne: current._id } });
  if (existing) throw new Error("這個分類名稱已經存在了。");

  current.name = name;
  await current.save();
  return { id, name };
}

export async function deleteItemCategory(id: string): Promise<boolean> {
  await connectMongo();
  if (!Types.ObjectId.isValid(id)) throw new Error("無效的 id");
  const objId = new Types.ObjectId(id);

  const { CatalogItem } = await import("@/lib/models/catalog-item");
  const itemCount = await CatalogItem.countDocuments({ categoryId: objId });
  if (itemCount > 0) throw new Error("這個分類底下還有品項，請先把品項改到其他分類再刪除。");

  const result = await ItemCategory.deleteOne({ _id: objId });
  return result.deletedCount > 0;
}
