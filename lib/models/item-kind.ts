import { Schema, model, models, Types } from "mongoose";
import { connectMongo } from "@/lib/mongoose";

/** menu_kinds collection —— 品項類型（餐點／飲料／點心／其他…），管理方式跟「分類」一樣
 *  （見 item-category.ts）：後台自己新增/刪除，不是寫死在程式碼裡的固定值。 */
export interface ItemKindDocument {
  _id: Types.ObjectId;
  name: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const itemKindSchema = new Schema<ItemKindDocument>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    sortOrder: { type: Number, required: true, default: 0 },
  },
  { timestamps: true, collection: "menu_item_kinds" },
);

export const ItemKind = models.ItemKind ?? model<ItemKindDocument>("ItemKind", itemKindSchema);

export interface ItemKindOption {
  id: string;
  name: string;
}

export async function listItemKinds(): Promise<ItemKindOption[]> {
  await connectMongo();
  const docs = await ItemKind.find({}).sort({ sortOrder: 1, createdAt: 1 });
  return docs.map((d) => ({ id: String(d._id), name: d.name }));
}

export async function createItemKind(name: string): Promise<ItemKindOption> {
  await connectMongo();
  const existing = await ItemKind.findOne({ name });
  if (existing) throw new Error("這個類型名稱已經存在了。");
  const count = await ItemKind.countDocuments();
  const doc = await ItemKind.create({ name, sortOrder: count });
  return { id: String(doc._id), name: doc.name };
}

export async function updateItemKind(id: string, name: string): Promise<ItemKindOption> {
  await connectMongo();
  if (!Types.ObjectId.isValid(id)) throw new Error("無效的 id");
  const current = await ItemKind.findById(id);
  if (!current) throw new Error("找不到這筆資料，可能已被刪除。");
  if (current.name === name) return { id, name };

  const existing = await ItemKind.findOne({ name, _id: { $ne: current._id } });
  if (existing) throw new Error("這個類型名稱已經存在了。");

  current.name = name;
  await current.save();
  return { id, name };
}

export async function deleteItemKind(id: string): Promise<boolean> {
  await connectMongo();
  if (!Types.ObjectId.isValid(id)) throw new Error("無效的 id");
  const objId = new Types.ObjectId(id);

  const { CatalogItem } = await import("@/lib/models/catalog-item");
  const itemCount = await CatalogItem.countDocuments({ kindId: objId });
  if (itemCount > 0) throw new Error("這個類型底下還有品項，請先把品項改到其他類型再刪除。");

  const result = await ItemKind.deleteOne({ _id: objId });
  return result.deletedCount > 0;
}
