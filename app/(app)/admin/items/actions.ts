"use server";

import { revalidatePath } from "next/cache";
import {
  setCatalogItemsActive,
  setCatalogItemsPage,
  patchCatalogItem,
  deleteCatalogItems,
  upsertCatalogItemByName,
  type CatalogItemInput,
} from "@/lib/models/catalog-item";
import { listItemCategories, createItemCategory } from "@/lib/models/item-category";
import { listPages } from "@/lib/models/page";
import { listTagGroups, createTagGroup, addTagOption } from "@/lib/models/tag-group";

export async function setItemsActiveAction(ids: string[], active: boolean) {
  await setCatalogItemsActive(ids, active);
  revalidatePath("/admin/items");
}

export async function deleteItemsAction(ids: string[]) {
  await deleteCatalogItems(ids);
  revalidatePath("/admin/items");
}

/** pageId 傳 "" 代表批次取消掛頁面（跟 items-table 的「取消掛頁面」選項對應）。 */
export async function setItemsPageAction(ids: string[], pageId: string) {
  await setCatalogItemsPage(ids, pageId || undefined);
  revalidatePath("/admin/items");
}

/** 品項設定列表頁的 inline 快速編輯（分類／價錢／標籤群組）共用一支 action。 */
export async function patchItemAction(
  id: string,
  patch: Partial<Pick<CatalogItemInput, "categoryId" | "price" | "tags">>,
) {
  await patchCatalogItem(id, patch);
  revalidatePath("/admin/items");
}

export interface ItemImportRow {
  name: string;
  categoryName: string;
  /** 每個標籤群組欄一筆，groupName 是 CSV 欄名，value 空字串代表這列這個群組沒填。 */
  tagsByGroup: { groupName: string; value: string }[];
  price: number;
  emoji: string;
  /** 目前只存路徑字串（跟品項編輯頁的圖片欄位一樣），還沒有實際圖片上傳/託管後端。 */
  imageUrl?: string;
  pageName?: string;
  active: boolean;
}

export interface ItemImportSummary {
  created: number;
  updated: number;
  categoriesCreated: string[];
  tagGroupsCreated: string[];
  /** "群組名：選項值" 格式。 */
  tagOptionsCreated: string[];
  errors: string[];
}

/** CSV 匯入：分類/頁面/標籤群組都用名稱比對（CSV 是給人看/編輯的，不會存 ObjectId）。
 *  分類、標籤群組、標籤選項找不到就自動建立，讓「從空系統匯入舊資料」也能一次跑起來；
 *  頁面維持原本行為——找不到就留空、不自動建立（頁面欄位多、屬於前台導覽，自動生成品質不會好）。
 *  同一次匯入裡新建過的分類/群組/選項會快取起來，不會同名重複建立。 */
export async function importItemsAction(rows: ItemImportRow[]): Promise<ItemImportSummary> {
  const [categories, pages, tagGroups] = await Promise.all([listItemCategories(), listPages(), listTagGroups()]);
  const categoryIdByName = new Map(categories.map((c) => [c.name, c.id]));
  const pageIdByName = new Map(pages.map((p) => [p.name, p.id]));
  const groupByName = new Map(tagGroups.map((g) => [g.name, { id: g.id, options: new Set(g.options) }]));

  let created = 0;
  let updated = 0;
  const categoriesCreated: string[] = [];
  const tagGroupsCreated: string[] = [];
  const tagOptionsCreated: string[] = [];
  const errors: string[] = [];

  for (const [index, row] of rows.entries()) {
    const line = index + 2; // 第 1 列是標題列
    if (!row.name) {
      errors.push(`第 ${line} 列：缺少品項名稱，已略過。`);
      continue;
    }

    let categoryId = categoryIdByName.get(row.categoryName);
    if (!categoryId) {
      if (!row.categoryName) {
        errors.push(`第 ${line} 列「${row.name}」：缺少分類名稱，已略過。`);
        continue;
      }
      try {
        const newCategory = await createItemCategory(row.categoryName);
        categoryId = newCategory.id;
        categoryIdByName.set(row.categoryName, categoryId);
        categoriesCreated.push(row.categoryName);
      } catch (e) {
        errors.push(
          `第 ${line} 列「${row.name}」：建立分類「${row.categoryName}」失敗，${e instanceof Error ? e.message : "已略過"}。`,
        );
        continue;
      }
    }

    const pageId = row.pageName ? pageIdByName.get(row.pageName) : undefined;
    if (row.pageName && !pageId) {
      errors.push(`第 ${line} 列「${row.name}」：找不到頁面「${row.pageName}」，已略過頁面設定。`);
    }

    const tags: string[] = [];
    for (const { groupName, value } of row.tagsByGroup) {
      if (!value) continue;

      let group = groupByName.get(groupName);
      if (!group) {
        try {
          const newGroup = await createTagGroup(groupName);
          group = { id: newGroup.id, options: new Set(newGroup.options) };
          groupByName.set(groupName, group);
          tagGroupsCreated.push(groupName);
        } catch (e) {
          errors.push(
            `第 ${line} 列「${row.name}」：建立標籤群組「${groupName}」失敗，${e instanceof Error ? e.message : "已略過此標籤"}。`,
          );
          continue;
        }
      }

      if (!group.options.has(value)) {
        try {
          await addTagOption(group.id, value);
          group.options.add(value);
          tagOptionsCreated.push(`${groupName}：${value}`);
        } catch (e) {
          errors.push(
            `第 ${line} 列「${row.name}」：新增標籤選項「${value}」到「${groupName}」失敗，${e instanceof Error ? e.message : "已忽略"}。`,
          );
          continue;
        }
      }
      tags.push(value);
    }

    try {
      const result = await upsertCatalogItemByName({
        name: row.name,
        categoryId,
        pageId,
        price: row.price,
        tags,
        emoji: row.emoji,
        imageUrl: row.imageUrl,
        active: row.active,
      });
      if (result.created) created += 1;
      else updated += 1;
    } catch (e) {
      errors.push(`第 ${line} 列「${row.name}」：${e instanceof Error ? e.message : "匯入失敗"}`);
    }
  }

  revalidatePath("/admin/items");
  revalidatePath("/admin/classification");
  return { created, updated, categoriesCreated, tagGroupsCreated, tagOptionsCreated, errors };
}
