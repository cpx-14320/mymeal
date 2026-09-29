"use server";

import { revalidatePath } from "next/cache";
import { MAX_UPLOAD_IMAGE_BYTES, MAX_UPLOAD_IMAGE_LABEL } from "@/lib/upload-limits";
import { uploadKeyedImage } from "@/lib/blob-upload";
import { listCatalogItems, setCatalogItemImage } from "@/lib/models/catalog-item";
import { requireAdminPermission } from "@/lib/admin-guard";

export interface UploadImageState {
  url?: string;
  error?: string;
}

/** 圖片上傳到 Vercel Blob，固定放在 mymeal/items_images/ 資料夾下，公開存取（access: "public"）
 *  這樣回傳的 blob.url 才能直接存進 imageUrl、讓前台/後台畫面直接讀取。
 *  這支是 ImageField 預設的上傳邏輯（品項用這支；廣告圖片改用 admin/promos/upload-image-action.ts
 *  的 uploadPromoImageAction，透過 ImageField 的 uploadAction 屬性換掉，folder/命名各自獨立）：
 *  有帶合法的 itemId（新增模式是進頁面就先產生好的 pendingItemId）就用它命名，
 *  跟網址列看到的品項 id 一致，方便在 Vercel 的 Blob 檔案總管對應回是哪個品項，
 *  同一個品項重新上傳圖片也會直接覆蓋舊檔；換一張副檔名不同的圖也不會留下孤兒檔案
 *  （見 lib/blob-upload.ts 的 uploadKeyedImage，會先清掉副檔名不同的舊檔）；
 *  沒有合法 itemId 就照舊用隨機檔名，一樣不會互相覆蓋。 */
export async function uploadItemImageAction(formData: FormData): Promise<UploadImageState> {
  try {
    await requireAdminPermission("items");
  } catch (err) {
    return { error: err instanceof Error ? err.message : "沒有權限。" };
  }
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "沒有選到檔案。" };
  }
  if (!file.type.startsWith("image/")) {
    return { error: "請選擇圖片檔案。" };
  }
  if (file.size > MAX_UPLOAD_IMAGE_BYTES) {
    return { error: `圖片檔案過大（超過 ${MAX_UPLOAD_IMAGE_LABEL}），請壓縮後再上傳。` };
  }
  const itemId = String(formData.get("itemId") ?? "");
  const useItemId = /^[a-f0-9]{24}$/i.test(itemId);
  const previousUrl = String(formData.get("previousUrl") ?? "").trim() || undefined;

  try {
    const url = await uploadKeyedImage({
      folder: "mymeal/items_images",
      key: useItemId ? itemId : crypto.randomUUID(),
      file,
      previousUrl: useItemId ? previousUrl : undefined,
    });
    return { url };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "上傳失敗，請稍後再試。" };
  }
}

export interface BatchUploadImagesResult {
  /** 成功比對並上傳的品項名稱。 */
  uploaded: string[];
  /** 檔名（去除副檔名）比不到任何品項名稱。 */
  unmatched: string[];
  /** 「檔名：原因」。 */
  errors: string[];
}

/** 批次上傳品項圖片：一次選多個檔案，以「檔名（去除副檔名）」比對品項名稱——
 *  對上就用該品項真正的 _id 命名（跟單張上傳同一套命名邏輯）上傳到 Blob，
 *  再把回傳網址存回該品項的 imageUrl；比不到名稱的檔案列在 unmatched，
 *  不會自動建立新品項（批次上傳只補圖，不是用來新增品項的）。 */
export async function batchUploadItemImagesAction(formData: FormData): Promise<BatchUploadImagesResult> {
  await requireAdminPermission("items");
  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  const uploaded: string[] = [];
  const unmatched: string[] = [];
  const errors: string[] = [];
  if (files.length === 0) return { uploaded, unmatched, errors };

  const items = await listCatalogItems();
  const itemByName = new Map(items.map((it) => [it.name, it]));

  for (const file of files) {
    const dot = file.name.lastIndexOf(".");
    const base = (dot > 0 ? file.name.slice(0, dot) : file.name).trim();

    const item = itemByName.get(base);
    if (!item) {
      unmatched.push(file.name);
      continue;
    }
    if (!file.type.startsWith("image/")) {
      errors.push(`${file.name}：不是圖片檔案，已略過。`);
      continue;
    }
    if (file.size > MAX_UPLOAD_IMAGE_BYTES) {
      errors.push(`${file.name}：圖片檔案過大（超過 ${MAX_UPLOAD_IMAGE_LABEL}），已略過。`);
      continue;
    }

    try {
      const url = await uploadKeyedImage({
        folder: "mymeal/items_images",
        key: item.id,
        file,
        previousUrl: item.imageUrl,
      });
      await setCatalogItemImage(item.id, url);
      uploaded.push(base);
    } catch (err) {
      errors.push(`${file.name}：${err instanceof Error ? err.message : "上傳失敗"}`);
    }
  }

  revalidatePath("/admin/items");
  return { uploaded, unmatched, errors };
}
