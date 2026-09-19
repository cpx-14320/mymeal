"use server";

import { listReviewsForItem, type ItemReviewEntry } from "@/lib/models/item-review";

export async function getItemReviewsAction(itemId: string): Promise<ItemReviewEntry[]> {
  return listReviewsForItem(itemId);
}
