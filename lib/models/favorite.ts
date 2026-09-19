import { Schema, model, models, Types } from "mongoose";
import { connectMongo } from "@/lib/mongoose";
import "@/lib/models/catalog-item"; // 確保 populate("itemId") 前 CatalogItem（連帶 ItemCategory）model 一定已註冊

/** favorites collection —— 會員與品項的多對多關係；只記錄不公開，取消收藏就整筆刪除。 */
export interface FavoriteDocument {
  _id: Types.ObjectId;
  memberId: Types.ObjectId; // ref Member
  itemId: Types.ObjectId; // ref CatalogItem
  at: Date;
}

const favoriteSchema = new Schema<FavoriteDocument>(
  {
    memberId: { type: Schema.Types.ObjectId, ref: "Member", required: true },
    itemId: { type: Schema.Types.ObjectId, ref: "CatalogItem", required: true },
    at: { type: Date, required: true, default: Date.now },
  },
  { timestamps: false, collection: "member_favorites" },
);
favoriteSchema.index({ memberId: 1, itemId: 1 }, { unique: true });

export const Favorite = models.Favorite ?? model<FavoriteDocument>("Favorite", favoriteSchema);

export interface FavoriteView {
  itemId: string;
  itemName: string;
  emoji: string;
  categoryName: string;
  tags: string[];
  at: Date;
}

interface PopulatedItem {
  _id: Types.ObjectId;
  name: string;
  emoji: string;
  tags: string[];
  categoryId?: { name: string };
}

/** 給會員洞察「收藏」分頁用：依收藏時間新到舊排序，品項已解析成顯示用欄位。 */
export async function listFavoritesByMember(memberId: string): Promise<FavoriteView[]> {
  await connectMongo();
  if (!Types.ObjectId.isValid(memberId)) return [];
  const docs = await Favorite.find({ memberId })
    .sort({ at: -1 })
    .populate<{ itemId: PopulatedItem }>({ path: "itemId", populate: { path: "categoryId" } });
  return docs
    .filter((d) => d.itemId)
    .map((d) => {
      const item = d.itemId as unknown as PopulatedItem;
      return {
        itemId: String(item._id),
        itemName: item.name,
        emoji: item.emoji,
        categoryName: item.categoryId?.name ?? "",
        tags: item.tags,
        at: d.at,
      };
    });
}

/** 收藏／取消收藏切換：依資料庫目前真的狀態決定動作（不靠前端傳目前狀態），回傳切換後的結果。 */
export async function toggleFavorite(memberId: string, itemId: string): Promise<{ favorited: boolean }> {
  await connectMongo();
  if (!Types.ObjectId.isValid(memberId)) throw new Error("請先登入。");
  if (!Types.ObjectId.isValid(itemId)) throw new Error("無效的品項。");

  const existing = await Favorite.findOne({ memberId, itemId });
  if (existing) {
    await Favorite.deleteOne({ _id: existing._id });
    return { favorited: false };
  }
  await Favorite.create({ memberId, itemId });
  return { favorited: true };
}

/** 給會員洞察列表頁用：一次算出多位會員各自的收藏數量，避免逐筆查詢。 */
export async function countFavoritesByMembers(memberIds: string[]): Promise<Record<string, number>> {
  await connectMongo();
  const objIds = memberIds.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id));
  if (objIds.length === 0) return {};
  const rows = await Favorite.aggregate([
    { $match: { memberId: { $in: objIds } } },
    { $group: { _id: "$memberId", count: { $sum: 1 } } },
  ]);
  return Object.fromEntries(rows.map((r) => [String(r._id), r.count]));
}
