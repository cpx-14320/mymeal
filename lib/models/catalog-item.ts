import { Schema, model, models, Types } from "mongoose";
import { connectMongo } from "@/lib/mongoose";
// 確保 populate("categoryId"/"pageId") 前這幾個 model 一定已註冊，
// 不依賴這次 request 剛好先經過哪個其他頁面（不然會間歇性 MissingSchemaError）。
import "@/lib/models/item-category";
import "@/lib/models/page";
import { getCreatorLabels, backfillCreatorMemberIds, type CreatorLabel } from "@/lib/models/creator";

/** menu_items collection —— 全站唯一的品項來源，模板／開團都只存 itemId 再回頭查。 */
export interface CatalogItemDocument {
  _id: Types.ObjectId;
  name: string;
  price: number;
  categoryId: Types.ObjectId; // ref ItemCategory
  pageId?: Types.ObjectId; // ref Page
  tags: string[]; // 值取自 tag_group.options，不強制外鍵
  emoji: string;
  imageUrl?: string;
  active: boolean;
  createdBy: string; // 建立者姓名快照；無登入會員時記「系統」
  createdByMemberId?: Types.ObjectId | null; // 建立者會員 id，用來查目前是否還有這項權限；null 代表補過但對不到人
  createdAt: Date;
  updatedAt: Date;
}

const catalogItemSchema = new Schema<CatalogItemDocument>(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    categoryId: { type: Schema.Types.ObjectId, ref: "ItemCategory", required: true },
    pageId: { type: Schema.Types.ObjectId, ref: "Page" },
    tags: { type: [String], required: true, default: [] },
    emoji: { type: String, required: true, default: "🍽️" },
    imageUrl: { type: String },
    active: { type: Boolean, required: true, default: true },
    createdBy: { type: String, required: true, trim: true, default: "系統" },
    createdByMemberId: { type: Schema.Types.ObjectId, ref: "Member" },
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
  categoryId: string;
  pageId?: string;
  price: number;
  tags: string[];
  emoji: string;
  imageUrl?: string;
  active?: boolean;
}

export interface CatalogItemView {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  pageId?: string;
  pageName?: string;
  price: number;
  tags: string[];
  emoji: string;
  imageUrl?: string;
  active: boolean;
  createdBy: string;
  createdByMemberId?: string;
  /** 建立者現在的權限狀態——查得到才會有值，例如「已無此權限」「帳號已刪除」；只有清單頁（listCatalogItems）會帶。 */
  createdByLabel?: CreatorLabel;
}

interface PopulatedRef {
  _id: Types.ObjectId;
  name: string;
}

function toView(d: {
  _id: Types.ObjectId;
  name: string;
  categoryId: PopulatedRef | Types.ObjectId;
  pageId?: PopulatedRef | Types.ObjectId;
  price: number;
  tags: string[];
  emoji: string;
  imageUrl?: string;
  active: boolean;
  createdBy: string;
  createdByMemberId?: Types.ObjectId | null;
}): CatalogItemView {
  const category = d.categoryId as PopulatedRef;
  const page = d.pageId as PopulatedRef | undefined;
  return {
    id: String(d._id),
    name: d.name,
    categoryId: String(category?._id ?? d.categoryId),
    categoryName: category?.name ?? "",
    pageId: page?._id ? String(page._id) : undefined,
    pageName: page?.name,
    price: d.price,
    tags: d.tags,
    emoji: d.emoji,
    imageUrl: d.imageUrl,
    active: d.active,
    createdBy: d.createdBy,
    createdByMemberId: d.createdByMemberId ? String(d.createdByMemberId) : undefined,
  };
}

/** withCreatorLabels：只有品項設定清單頁（會顯示「建立者」欄）才需要開——會多查一次會員/角色權限，
 *  其他呼叫端（前台選單、開團訂餐等）用不到，不用多負擔這個查詢。 */
export async function listCatalogItems(options?: { withCreatorLabels?: boolean }): Promise<CatalogItemView[]> {
  await connectMongo();
  if (options?.withCreatorLabels) await backfillCreatorMemberIds(CatalogItem);
  const docs = await CatalogItem.find({})
    .sort({ createdAt: -1 })
    .populate<{ categoryId: PopulatedRef; pageId?: PopulatedRef }>(["categoryId", "pageId"]);
  const items = docs.map((d) => toView(d as unknown as Parameters<typeof toView>[0]));
  if (!options?.withCreatorLabels) return items;

  const labels = await getCreatorLabels(
    items.map((it) => it.createdByMemberId),
    "items",
  );
  return items.map((it) => ({
    ...it,
    createdByLabel: it.createdByMemberId ? labels.get(it.createdByMemberId) : undefined,
  }));
}

/** 頁面詳情用：這個頁面的所有品項——item.pageId 是必填欄位，比模板的 pageId（選填，混合頁面會留空）可靠。 */
export async function listCatalogItemsByPage(pageId: string): Promise<CatalogItemView[]> {
  await connectMongo();
  if (!Types.ObjectId.isValid(pageId)) return [];
  const docs = await CatalogItem.find({ pageId: new Types.ObjectId(pageId) })
    .sort({ createdAt: -1 })
    .populate<{ categoryId: PopulatedRef; pageId?: PopulatedRef }>(["categoryId", "pageId"]);
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
    categoryId: PopulatedRef;
    pageId?: PopulatedRef;
  }>(["categoryId", "pageId"]);
  const byId = new Map(docs.map((d) => [String(d._id), toView(d as unknown as Parameters<typeof toView>[0])]));
  return uniqueIds.map((id) => byId.get(id)).filter((v): v is CatalogItemView => !!v);
}

export async function findCatalogItemById(id: string): Promise<CatalogItemView | null> {
  await connectMongo();
  if (!Types.ObjectId.isValid(id)) return null;
  const doc = await CatalogItem.findById(id).populate<{
    categoryId: PopulatedRef;
    pageId?: PopulatedRef;
  }>(["categoryId", "pageId"]);
  return doc ? toView(doc) : null;
}

/** 圖片路徑欄位允許手動輸入（不一定是上傳出來的 Blob 網址），
 *  但要嘛是「/」開頭的站內路徑，要嘛是完整網址，否則 next/image 在渲染時
 *  會直接對這個字串呼叫 new URL() 而丟出例外，把整頁弄掛（例如「全部」顯示、
 *  一次渲染所有品項卡片時中一張圖）——所以存檔前就先擋掉，不合格式的直接告知使用者。 */
function isValidImageUrl(value: string): boolean {
  if (value.startsWith("/")) return true;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function checkImageUrl(imageUrl: string | undefined) {
  if (imageUrl && !isValidImageUrl(imageUrl)) {
    throw new Error("品項圖片路徑格式不正確，請用「/」開頭的路徑或完整網址，或改用上傳圖片。");
  }
}

function buildDoc(input: CatalogItemInput) {
  if (!Types.ObjectId.isValid(input.categoryId)) throw new Error("請選擇有效的分類。");
  if (input.pageId && !Types.ObjectId.isValid(input.pageId)) {
    throw new Error("請選擇有效的頁面。");
  }
  checkImageUrl(input.imageUrl);
  return {
    name: input.name,
    categoryId: new Types.ObjectId(input.categoryId),
    pageId: input.pageId ? new Types.ObjectId(input.pageId) : undefined,
    price: input.price,
    tags: input.tags,
    emoji: input.emoji || "🍽️",
    imageUrl: input.imageUrl || undefined,
    active: input.active ?? true,
  };
}

/** 更新用：跟 buildDoc 不同——pageId/imageUrl 清空時要真的用 $unset 拿掉欄位。
 *  單純把 undefined 丟進 $set（buildDoc 的做法，給「新建文件」用沒問題）在
 *  findByIdAndUpdate 這種更新情境會被 Mongoose 直接濾掉那個 key，等於沒送出
 *  這個欄位，資料庫裡的舊值完全不會被改到——這就是「按清除再存檔，圖片還在」的成因。 */
function buildUpdate(input: CatalogItemInput) {
  if (!Types.ObjectId.isValid(input.categoryId)) throw new Error("請選擇有效的分類。");
  if (input.pageId && !Types.ObjectId.isValid(input.pageId)) {
    throw new Error("請選擇有效的頁面。");
  }
  checkImageUrl(input.imageUrl);
  const set: Record<string, unknown> = {
    name: input.name,
    categoryId: new Types.ObjectId(input.categoryId),
    price: input.price,
    tags: input.tags,
    emoji: input.emoji || "🍽️",
    active: input.active ?? true,
  };
  const unset: Record<string, ""> = {};
  if (input.pageId) set.pageId = new Types.ObjectId(input.pageId);
  else unset.pageId = "";
  if (input.imageUrl) set.imageUrl = input.imageUrl;
  else unset.imageUrl = "";

  const update: Record<string, unknown> = { $set: set };
  if (Object.keys(unset).length > 0) update.$unset = unset;
  return update;
}

/** 新增品項頁一進來就先產生這個，讓圖片上傳（選檔當下就會傳到 Vercel Blob，
 *  早於品項真正存檔）跟最終建立的品項用同一個 id 命名，不用等品項存檔後才知道 id。 */
export function newCatalogItemId(): string {
  return new Types.ObjectId().toString();
}

export async function createCatalogItem(
  input: CatalogItemInput,
  createdBy?: string,
  id?: string,
  createdByMemberId?: string,
) {
  await connectMongo();
  if (id && !Types.ObjectId.isValid(id)) throw new Error("無效的品項 id");
  const doc = await CatalogItem.create({
    ...(id ? { _id: new Types.ObjectId(id) } : {}),
    ...buildDoc(input),
    createdBy: createdBy ?? "系統",
    createdByMemberId:
      createdByMemberId && Types.ObjectId.isValid(createdByMemberId)
        ? new Types.ObjectId(createdByMemberId)
        : undefined,
  });
  return { id: String(doc._id) };
}

export async function updateCatalogItem(id: string, input: CatalogItemInput) {
  await connectMongo();
  if (!Types.ObjectId.isValid(id)) throw new Error("無效的品項 id");
  const doc = await CatalogItem.findByIdAndUpdate(id, buildUpdate(input), { returnDocument: "after" });
  return doc;
}

/** CSV 匯入用：同名品項視為同一筆（更新），沒有就新增——讓「匯出→編輯→匯入」可以重複跑。 */
export async function upsertCatalogItemByName(
  input: CatalogItemInput,
  createdBy?: string,
  createdByMemberId?: string,
): Promise<{ id: string; created: boolean }> {
  await connectMongo();
  const existing = await CatalogItem.findOne({ name: input.name });
  if (existing) {
    await CatalogItem.findByIdAndUpdate(existing._id, buildUpdate(input));
    return { id: String(existing._id), created: false };
  }
  const doc = await CatalogItem.create({
    ...buildDoc(input),
    createdBy: createdBy ?? "系統",
    createdByMemberId:
      createdByMemberId && Types.ObjectId.isValid(createdByMemberId)
        ? new Types.ObjectId(createdByMemberId)
        : undefined,
  });
  return { id: String(doc._id), created: true };
}

export async function setCatalogItemsActive(ids: string[], active: boolean): Promise<number> {
  await connectMongo();
  const objIds = ids.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id));
  if (objIds.length === 0) return 0;
  const result = await CatalogItem.updateMany({ _id: { $in: objIds } }, { $set: { active } });
  return result.modifiedCount;
}

/** 品項設定列表頁的 inline 快速編輯用：只更新有帶到的欄位（分類／價錢／標籤），
 *  跟 updateCatalogItem 不同——那支是整份表單存檔，這支是單一儲存格改完就送。 */
export async function patchCatalogItem(
  id: string,
  patch: Partial<Pick<CatalogItemInput, "categoryId" | "price" | "tags">>,
): Promise<void> {
  await connectMongo();
  if (!Types.ObjectId.isValid(id)) throw new Error("無效的品項 id");

  const set: Record<string, unknown> = {};
  if (patch.categoryId !== undefined) {
    if (!Types.ObjectId.isValid(patch.categoryId)) throw new Error("無效的分類 id");
    set.categoryId = new Types.ObjectId(patch.categoryId);
  }
  if (patch.price !== undefined) set.price = patch.price;
  if (patch.tags !== undefined) set.tags = patch.tags;
  if (Object.keys(set).length === 0) return;

  await CatalogItem.updateOne({ _id: new Types.ObjectId(id) }, { $set: set });
}

export interface CatalogItemBulkPatch {
  /** undefined＝不變；空字串＝取消掛頁面。 */
  pageId?: string;
  /** undefined＝不變。 */
  categoryId?: string;
  /** undefined＝不變。 */
  price?: number;
  /** 只放這次真的要改的標籤群組；value 空字串＝清空這組。同一品項若不屬於任何列出的群組的既有標籤，原樣保留。 */
  tagGroups?: { groupOptions: string[]; value: string }[];
}

/** 品項設定列表頁的「批次編輯」彈窗用：頁面／分類／價錢是所有選取品項統一套用同一個值，
 *  標籤群組則是每個品項各自的 tags 陣列裡「屬於這個群組的那一個」被換掉，其餘標籤（含其他群組）不受影響，
 *  所以標籤這段沒辦法跟其他欄位一樣用單一 updateMany 打完，要先各自查出目前的 tags 再逐筆 bulkWrite。 */
export async function patchCatalogItemsBulk(ids: string[], patch: CatalogItemBulkPatch): Promise<number> {
  await connectMongo();
  const objIds = ids.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id));
  if (objIds.length === 0) return 0;

  const set: Record<string, unknown> = {};
  const unset: Record<string, ""> = {};
  if (patch.categoryId !== undefined) {
    if (!Types.ObjectId.isValid(patch.categoryId)) throw new Error("無效的分類 id");
    set.categoryId = new Types.ObjectId(patch.categoryId);
  }
  if (patch.pageId !== undefined) {
    if (patch.pageId) {
      if (!Types.ObjectId.isValid(patch.pageId)) throw new Error("無效的頁面 id");
      set.pageId = new Types.ObjectId(patch.pageId);
    } else {
      unset.pageId = "";
    }
  }
  if (patch.price !== undefined) set.price = patch.price;

  if (Object.keys(set).length > 0 || Object.keys(unset).length > 0) {
    const update: Record<string, unknown> = {};
    if (Object.keys(set).length > 0) update.$set = set;
    if (Object.keys(unset).length > 0) update.$unset = unset;
    await CatalogItem.updateMany({ _id: { $in: objIds } }, update);
  }

  if (patch.tagGroups && patch.tagGroups.length > 0) {
    const docs = await CatalogItem.find({ _id: { $in: objIds } }).select("tags");
    const ops = docs.map((d) => {
      let tags: string[] = d.tags;
      for (const { groupOptions, value } of patch.tagGroups!) {
        const rest = tags.filter((t: string) => !groupOptions.includes(t));
        tags = value ? [...rest, value] : rest;
      }
      return { updateOne: { filter: { _id: d._id }, update: { $set: { tags } } } };
    });
    if (ops.length > 0) await CatalogItem.bulkWrite(ops);
  }

  return objIds.length;
}

/** 批次上傳圖片用：只更新 imageUrl，不動其他欄位（圖片本身已經上傳到 Blob，這裡只是把網址存回去）。 */
export async function setCatalogItemImage(id: string, imageUrl: string): Promise<void> {
  await connectMongo();
  if (!Types.ObjectId.isValid(id)) throw new Error("無效的品項 id");
  await CatalogItem.updateOne({ _id: new Types.ObjectId(id) }, { $set: { imageUrl } });
}

/** pageId 傳空字串／undefined 代表「取消掛頁面」，用 $unset 而非把欄位存成空字串。 */
export async function setCatalogItemsPage(ids: string[], pageId: string | undefined): Promise<number> {
  await connectMongo();
  const objIds = ids.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id));
  if (objIds.length === 0) return 0;
  if (pageId && !Types.ObjectId.isValid(pageId)) throw new Error("無效的頁面 id");

  const update = pageId
    ? { $set: { pageId: new Types.ObjectId(pageId) } }
    : { $unset: { pageId: "" } };
  const result = await CatalogItem.updateMany({ _id: { $in: objIds } }, update);
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

  // 收藏／評論指向被刪的品項就沒有意義了，一併清掉，不留孤兒紀錄。
  const { Favorite } = await import("@/lib/models/favorite");
  const { ItemReview } = await import("@/lib/models/item-review");
  await Promise.all([
    Favorite.deleteMany({ itemId: { $in: objIds } }),
    ItemReview.deleteMany({ itemId: { $in: objIds } }),
  ]);

  const result = await CatalogItem.deleteMany({ _id: { $in: objIds } });
  return result.deletedCount;
}

/* ── 餐點統計（後台「餐點統計」頁用）── */

export interface CatalogItemStat {
  itemId: string;
  itemName: string;
  emoji: string;
  imageUrl?: string;
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
        emoji: it.emoji,
        imageUrl: it.imageUrl,
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
    emoji: item.emoji,
    imageUrl: item.imageUrl,
    price: item.price,
    totalQuantity: order?.totalQty ?? 0,
    orderCount: order?.orderCount ?? 0,
    avgRating: review?.avgRating ?? null,
    commentCount: review?.commentCount ?? 0,
  };
}
