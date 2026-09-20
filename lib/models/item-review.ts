import { Schema, model, models, Types } from "mongoose";
import { connectMongo } from "@/lib/mongoose";
// 確保 populate("itemId"/"memberId") 前 CatalogItem／Member model 一定已註冊。
import "@/lib/models/catalog-item";
import "@/lib/models/member";

/**
 * item_reviews collection —— 合併「評分」跟「評論」：一筆評論本來就該同時帶星等，
 * 只評分不留言時 text 留空。一人對同一品項只有一筆，重複評論改成更新既有那筆。
 * 可見性：公開，任何人瀏覽品項都看得到評論者姓名／星等／內容。
 */
export interface ItemReviewDocument {
  _id: Types.ObjectId;
  memberId: Types.ObjectId; // ref Member
  itemId: Types.ObjectId; // ref CatalogItem
  stars: number; // 1-5
  text?: string;
  at: Date;
}

const itemReviewSchema = new Schema<ItemReviewDocument>(
  {
    memberId: { type: Schema.Types.ObjectId, ref: "Member", required: true },
    itemId: { type: Schema.Types.ObjectId, ref: "CatalogItem", required: true },
    stars: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String },
    at: { type: Date, required: true, default: Date.now },
  },
  { timestamps: false, collection: "menu_items_reviews" },
);
itemReviewSchema.index({ memberId: 1, itemId: 1 }, { unique: true });

export const ItemReview = models.ItemReview ?? model<ItemReviewDocument>("ItemReview", itemReviewSchema);

export interface ItemReviewView {
  itemId: string;
  itemName: string;
  stars: number;
  text?: string;
  at: Date;
}

interface PopulatedItem {
  _id: Types.ObjectId;
  name: string;
}

/** 給會員洞察「評分」分頁用：這位會員留下的所有評論／評分（每筆都一定有星等）。 */
export async function listReviewsByMember(memberId: string): Promise<ItemReviewView[]> {
  await connectMongo();
  if (!Types.ObjectId.isValid(memberId)) return [];
  const docs = await ItemReview.find({ memberId })
    .sort({ at: -1 })
    .populate<{ itemId: PopulatedItem }>("itemId");
  return docs
    .filter((d) => d.itemId)
    .map((d) => {
      const item = d.itemId as unknown as PopulatedItem;
      return { itemId: String(item._id), itemName: item.name, stars: d.stars, text: d.text, at: d.at };
    });
}

/** 給會員洞察「評論留言」分頁用：只挑有寫文字的那些。 */
export async function listCommentsByMember(memberId: string): Promise<ItemReviewView[]> {
  const all = await listReviewsByMember(memberId);
  return all.filter((r) => r.text && r.text.trim() !== "");
}

/** 給會員洞察列表頁用：一次算出多位會員各自的評分數／評論數（有寫文字的）。 */
export async function countReviewsByMembers(
  memberIds: string[],
): Promise<{ ratings: Record<string, number>; comments: Record<string, number> }> {
  await connectMongo();
  const objIds = memberIds.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id));
  if (objIds.length === 0) return { ratings: {}, comments: {} };

  const [ratingRows, commentRows] = await Promise.all([
    ItemReview.aggregate([
      { $match: { memberId: { $in: objIds } } },
      { $group: { _id: "$memberId", count: { $sum: 1 } } },
    ]),
    ItemReview.aggregate([
      { $match: { memberId: { $in: objIds }, text: { $exists: true, $ne: "" } } },
      { $group: { _id: "$memberId", count: { $sum: 1 } } },
    ]),
  ]);

  return {
    ratings: Object.fromEntries(ratingRows.map((r) => [String(r._id), r.count])),
    comments: Object.fromEntries(commentRows.map((r) => [String(r._id), r.count])),
  };
}

export interface ItemStat {
  avgRating: number | null;
  commentCount: number;
}

/** 給前台品項卡片用：一次算出多個品項各自的平均星等／評論數（有寫文字的），避免逐筆查詢。 */
export async function getItemStatsByItems(itemIds: string[]): Promise<Record<string, ItemStat>> {
  await connectMongo();
  const objIds = itemIds.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id));
  if (objIds.length === 0) return {};

  const [ratingRows, commentRows] = await Promise.all([
    ItemReview.aggregate([
      { $match: { itemId: { $in: objIds } } },
      { $group: { _id: "$itemId", avg: { $avg: "$stars" } } },
    ]),
    ItemReview.aggregate([
      { $match: { itemId: { $in: objIds }, text: { $exists: true, $ne: "" } } },
      { $group: { _id: "$itemId", count: { $sum: 1 } } },
    ]),
  ]);

  const commentCountById = new Map(commentRows.map((r) => [String(r._id), r.count as number]));
  const stats: Record<string, ItemStat> = {};
  for (const r of ratingRows) {
    const id = String(r._id);
    stats[id] = { avgRating: r.avg as number, commentCount: commentCountById.get(id) ?? 0 };
  }
  return stats;
}

export interface ItemReviewEntry {
  memberName: string;
  stars: number;
  text?: string;
  at: Date;
}

interface PopulatedMember {
  _id: Types.ObjectId;
  name: string;
}

/** 給前台品項卡片的「評論」彈窗用：這個品項收到的所有評論（含留言），新到舊排序。 */
export async function listReviewsForItem(itemId: string): Promise<ItemReviewEntry[]> {
  await connectMongo();
  if (!Types.ObjectId.isValid(itemId)) return [];
  const docs = await ItemReview.find({ itemId, text: { $exists: true, $ne: "" } })
    .sort({ at: -1 })
    .populate<{ memberId: PopulatedMember }>("memberId");
  return docs
    .filter((d) => d.memberId)
    .map((d) => {
      const member = d.memberId as unknown as PopulatedMember;
      return { memberName: member.name, stars: d.stars, text: d.text, at: d.at };
    });
}

export interface MyReview {
  stars: number;
  text?: string;
}

/** 給前台評論表單用：這位會員對這個品項先前是否已經評論／評分過——有的話表單要顯示成編輯，不是空白新增。 */
export async function getMemberReviewForItem(memberId: string, itemId: string): Promise<MyReview | null> {
  await connectMongo();
  if (!Types.ObjectId.isValid(memberId) || !Types.ObjectId.isValid(itemId)) return null;
  const doc = await ItemReview.findOne({ memberId, itemId });
  return doc ? { stars: doc.stars, text: doc.text } : null;
}

/** 新增或更新這位會員對這個品項的評分／評論——同一人對同一品項只留一筆，重複送出視為修改既有那筆。 */
export async function upsertReview(memberId: string, itemId: string, stars: number, text: string): Promise<void> {
  await connectMongo();
  if (!Types.ObjectId.isValid(memberId) || !Types.ObjectId.isValid(itemId)) {
    throw new Error("無效的會員或品項 id");
  }
  const trimmed = text.trim();
  await ItemReview.findOneAndUpdate(
    { memberId, itemId },
    trimmed
      ? { $set: { stars, text: trimmed, at: new Date() } }
      : { $set: { stars, at: new Date() }, $unset: { text: "" } },
    { upsert: true },
  );
}
