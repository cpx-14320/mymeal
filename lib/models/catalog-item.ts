import { Schema, model, models, Types } from "mongoose";
import { connectMongo } from "@/lib/mongoose";
// 確保 populate("kindId"/"categoryId"/"supplierId") 前這幾個 model 一定已註冊，
// 不依賴這次 request 剛好先經過哪個其他頁面（不然會間歇性 MissingSchemaError）。
import "@/lib/models/item-kind";
import "@/lib/models/item-category";
import "@/lib/models/supplier";

/** menu_items collection —— 全站唯一的品項來源，模板／開團都只存 itemId 再回頭查。 */
export interface CatalogItemDocument {
  _id: Types.ObjectId;
  name: string;
  price: number;
  kindId: Types.ObjectId; // ref ItemKind
  categoryId: Types.ObjectId; // ref ItemCategory
  supplierId?: Types.ObjectId; // ref Supplier
  tags: string[]; // 值取自 tag_group.options，不強制外鍵
  emoji: string;
  imageUrl?: string;
  active: boolean;
  createdBy: string; // 建立者姓名快照；無登入會員時記「系統」
  createdAt: Date;
  updatedAt: Date;
}

const catalogItemSchema = new Schema<CatalogItemDocument>(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    kindId: { type: Schema.Types.ObjectId, ref: "ItemKind", required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "ItemCategory", required: true },
    supplierId: { type: Schema.Types.ObjectId, ref: "Supplier" },
    tags: { type: [String], required: true, default: [] },
    emoji: { type: String, required: true, default: "🍽️" },
    imageUrl: { type: String },
    active: { type: Boolean, required: true, default: true },
    createdBy: { type: String, required: true, trim: true, default: "系統" },
  },
  { timestamps: true, collection: "menu_items" },
);

export const CatalogItem =
  models.CatalogItem ?? model<CatalogItemDocument>("CatalogItem", catalogItemSchema);

/**
 * 從表單收集選中的標籤字串：可複選群組用共用的 "tags" 欄位（可多筆），
 * 單選群組用各自獨立的 "tags-radio-{groupId}" 欄位（避免不同單選群組的 radio 互搶互斥）。
 */
export function collectTagsFromFormData(formData: FormData): string[] {
  const tags = formData.getAll("tags").map(String);
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("tags-radio-") && typeof value === "string" && value) {
      tags.push(value);
    }
  }
  return tags;
}

export interface CatalogItemInput {
  name: string;
  kindId: string;
  categoryId: string;
  supplierId?: string;
  price: number;
  tags: string[];
  emoji: string;
  imageUrl?: string;
  active?: boolean;
}

export interface CatalogItemView {
  id: string;
  name: string;
  kindId: string;
  kindName: string;
  categoryId: string;
  categoryName: string;
  supplierId?: string;
  supplierName?: string;
  price: number;
  tags: string[];
  emoji: string;
  imageUrl?: string;
  active: boolean;
  createdBy: string;
}

interface PopulatedRef {
  _id: Types.ObjectId;
  name: string;
}

function toView(d: {
  _id: Types.ObjectId;
  name: string;
  kindId: PopulatedRef | Types.ObjectId;
  categoryId: PopulatedRef | Types.ObjectId;
  supplierId?: PopulatedRef | Types.ObjectId;
  price: number;
  tags: string[];
  emoji: string;
  imageUrl?: string;
  active: boolean;
  createdBy: string;
}): CatalogItemView {
  const kind = d.kindId as PopulatedRef;
  const category = d.categoryId as PopulatedRef;
  const supplier = d.supplierId as PopulatedRef | undefined;
  return {
    id: String(d._id),
    name: d.name,
    kindId: String(kind?._id ?? d.kindId),
    kindName: kind?.name ?? "",
    categoryId: String(category?._id ?? d.categoryId),
    categoryName: category?.name ?? "",
    supplierId: supplier?._id ? String(supplier._id) : undefined,
    supplierName: supplier?.name,
    price: d.price,
    tags: d.tags,
    emoji: d.emoji,
    imageUrl: d.imageUrl,
    active: d.active,
    createdBy: d.createdBy,
  };
}

export async function listCatalogItems(): Promise<CatalogItemView[]> {
  await connectMongo();
  const docs = await CatalogItem.find({})
    .sort({ createdAt: -1 })
    .populate<{ kindId: PopulatedRef; categoryId: PopulatedRef; supplierId?: PopulatedRef }>([
      "kindId",
      "categoryId",
      "supplierId",
    ]);
  return docs.map((d) => toView(d as unknown as Parameters<typeof toView>[0]));
}

/** 店家頁用：這家店的所有品項——item.supplierId 是必填欄位，比模板的 supplierId（選填，混合店家會留空）可靠。 */
export async function listCatalogItemsBySupplier(supplierId: string): Promise<CatalogItemView[]> {
  await connectMongo();
  if (!Types.ObjectId.isValid(supplierId)) return [];
  const docs = await CatalogItem.find({ supplierId: new Types.ObjectId(supplierId) })
    .sort({ createdAt: -1 })
    .populate<{ kindId: PopulatedRef; categoryId: PopulatedRef; supplierId?: PopulatedRef }>([
      "kindId",
      "categoryId",
      "supplierId",
    ]);
  return docs.map((d) => toView(d as unknown as Parameters<typeof toView>[0]));
}

/** 頁面套用模板時用：依一批品項 id 撈完整品項資料（模板 section 裡只存 id）。
 *  同一個品項可能被多個 section 引用（例如星期一、星期三都排了同一道菜），
 *  所以輸出依「第一次出現的順序」去重——呼叫端若要保留 section 內的重複顯示，
 *  自行再用回傳的 Map 依 id 查詢即可，這支只保證每個 id 只回傳一筆。 */
export async function listCatalogItemsByIds(ids: string[]): Promise<CatalogItemView[]> {
  await connectMongo();
  const uniqueIds = [...new Set(ids)];
  const objIds = uniqueIds.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id));
  if (objIds.length === 0) return [];
  const docs = await CatalogItem.find({ _id: { $in: objIds } }).populate<{
    kindId: PopulatedRef;
    categoryId: PopulatedRef;
    supplierId?: PopulatedRef;
  }>(["kindId", "categoryId", "supplierId"]);
  const byId = new Map(docs.map((d) => [String(d._id), toView(d as unknown as Parameters<typeof toView>[0])]));
  return uniqueIds.map((id) => byId.get(id)).filter((v): v is CatalogItemView => !!v);
}

export async function findCatalogItemById(id: string): Promise<CatalogItemView | null> {
  await connectMongo();
  if (!Types.ObjectId.isValid(id)) return null;
  const doc = await CatalogItem.findById(id).populate<{
    kindId: PopulatedRef;
    categoryId: PopulatedRef;
    supplierId?: PopulatedRef;
  }>(["kindId", "categoryId", "supplierId"]);
  return doc ? toView(doc) : null;
}

function buildDoc(input: CatalogItemInput) {
  if (!Types.ObjectId.isValid(input.kindId)) throw new Error("請選擇有效的類型。");
  if (!Types.ObjectId.isValid(input.categoryId)) throw new Error("請選擇有效的分類。");
  if (input.supplierId && !Types.ObjectId.isValid(input.supplierId)) {
    throw new Error("請選擇有效的店家。");
  }
  return {
    name: input.name,
    kindId: new Types.ObjectId(input.kindId),
    categoryId: new Types.ObjectId(input.categoryId),
    supplierId: input.supplierId ? new Types.ObjectId(input.supplierId) : undefined,
    price: input.price,
    tags: input.tags,
    emoji: input.emoji || "🍽️",
    imageUrl: input.imageUrl || undefined,
    active: input.active ?? true,
  };
}

export async function createCatalogItem(input: CatalogItemInput, createdBy?: string) {
  await connectMongo();
  const doc = await CatalogItem.create({ ...buildDoc(input), createdBy: createdBy ?? "系統" });
  return { id: String(doc._id) };
}

export async function updateCatalogItem(id: string, input: CatalogItemInput) {
  await connectMongo();
  if (!Types.ObjectId.isValid(id)) throw new Error("無效的品項 id");
  const doc = await CatalogItem.findByIdAndUpdate(id, { $set: buildDoc(input) }, { returnDocument: "after" });
  return doc;
}

export async function setCatalogItemsActive(ids: string[], active: boolean): Promise<number> {
  await connectMongo();
  const objIds = ids.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id));
  if (objIds.length === 0) return 0;
  const result = await CatalogItem.updateMany({ _id: { $in: objIds } }, { $set: { active } });
  return result.modifiedCount;
}

/** 刪除品項：連同從所有模板的 sections[].itemIds 裡移除該品項的參照，避免模板留下孤兒 id。 */
export async function deleteCatalogItems(ids: string[]): Promise<number> {
  await connectMongo();
  const objIds = ids.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id));
  if (objIds.length === 0) return 0;

  const { Template } = await import("@/lib/models/template");
  await Template.updateMany(
    { "sections.itemIds": { $in: objIds } },
    { $pull: { "sections.$[].itemIds": { $in: objIds } } },
  );

  const result = await CatalogItem.deleteMany({ _id: { $in: objIds } });
  return result.deletedCount;
}

/* ── 餐點統計（後台「餐點統計」頁用）── */

export interface CatalogItemStat {
  itemId: string;
  itemName: string;
  price: number;
  totalQuantity: number;
  orderCount: number;
  avgRating: number | null;
  commentCount: number;
}

/** 給後台「餐點統計」列表頁用：彙總每個品項的訂購量（來自團訂 lines）與評分／評論數（來自品項評論）。 */
export async function listItemStats(): Promise<CatalogItemStat[]> {
  const items = await listCatalogItems();
  const itemIds = items.map((it) => it.id);
  const [{ getItemStatsByItems }, { getItemOrderStats }] = await Promise.all([
    import("@/lib/models/item-review"),
    import("@/lib/models/group-order"),
  ]);
  const [reviewStats, orderStats] = await Promise.all([
    getItemStatsByItems(itemIds),
    getItemOrderStats(),
  ]);

  return items
    .map((it) => {
      const review = reviewStats[it.id];
      const order = orderStats[it.id];
      return {
        itemId: it.id,
        itemName: it.name,
        price: it.price,
        totalQuantity: order?.totalQty ?? 0,
        orderCount: order?.orderCount ?? 0,
        avgRating: review?.avgRating ?? null,
        commentCount: review?.commentCount ?? 0,
      };
    })
    .sort((a, b) => b.totalQuantity - a.totalQuantity);
}

/** 給後台「餐點統計」詳細頁用：單一品項的彙總數字。 */
export async function findItemStatById(id: string): Promise<CatalogItemStat | null> {
  const item = await findCatalogItemById(id);
  if (!item) return null;
  const [{ getItemStatsByItems }, { getItemOrderStats }] = await Promise.all([
    import("@/lib/models/item-review"),
    import("@/lib/models/group-order"),
  ]);
  const [reviewStats, orderStats] = await Promise.all([
    getItemStatsByItems([id]),
    getItemOrderStats(),
  ]);
  const review = reviewStats[id];
  const order = orderStats[id];
  return {
    itemId: item.id,
    itemName: item.name,
    price: item.price,
    totalQuantity: order?.totalQty ?? 0,
    orderCount: order?.orderCount ?? 0,
    avgRating: review?.avgRating ?? null,
    commentCount: review?.commentCount ?? 0,
  };
}
