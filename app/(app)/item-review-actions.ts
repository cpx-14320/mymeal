"use server";

import {
  listReviewsForItem,
  getItemStatsByItems,
  getMemberReviewForItem,
  upsertReview,
  deleteReview,
  type ItemReviewEntry,
  type ItemStat,
  type MyReview,
} from "@/lib/models/item-review";
import { getSessionMemberId } from "@/lib/session";

export async function getItemReviewsAction(
  itemId: string,
): Promise<{ entries: ItemReviewEntry[]; myReview: MyReview | null; isLoggedIn: boolean }> {
  const memberId = await getSessionMemberId();
  const [entries, myReview] = await Promise.all([
    listReviewsForItem(itemId),
    memberId ? getMemberReviewForItem(memberId, itemId) : Promise.resolve(null),
  ]);
  return { entries, myReview, isLoggedIn: !!memberId };
}

export async function submitItemReviewAction(
  itemId: string,
  stars: number,
  text: string,
): Promise<{ error?: string; entries?: ItemReviewEntry[]; stat?: ItemStat }> {
  const memberId = await getSessionMemberId();
  if (!memberId) return { error: "請先登入才能評論" };
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) return { error: "請選擇 1-5 星" };

  await upsertReview(memberId, itemId, stars, text);
  const [entries, stats] = await Promise.all([
    listReviewsForItem(itemId),
    getItemStatsByItems([itemId]),
  ]);
  return { entries, stat: stats[itemId] };
}

/** 真的刪除我對這個品項的評分／評論（跟送出空白內容不同，見 deleteReview 的說明）。 */
export async function deleteItemReviewAction(
  itemId: string,
): Promise<{ error?: string; entries?: ItemReviewEntry[]; stat?: ItemStat }> {
  const memberId = await getSessionMemberId();
  if (!memberId) return { error: "請先登入" };

  await deleteReview(memberId, itemId);
  const [entries, stats] = await Promise.all([
    listReviewsForItem(itemId),
    getItemStatsByItems([itemId]),
  ]);
  // 刪掉之後這個品項可能完全沒有評論了，這種情況 getItemStatsByItems 查不到任何一筆、
  // 不會回傳這個 itemId 的統計——這裡補一個歸零的預設值，不然呼叫端會誤以為刪除失敗、
  // 沿用刪除前的舊統計繼續顯示。
  return { entries, stat: stats[itemId] ?? { avgRating: null, commentCount: 0 } };
}
