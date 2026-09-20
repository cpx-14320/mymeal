"use server";

import {
  listReviewsForItem,
  getItemStatsByItems,
  getMemberReviewForItem,
  upsertReview,
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
