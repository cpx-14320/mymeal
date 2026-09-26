"use server";

import { put } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { MAX_UPLOAD_IMAGE_BYTES, MAX_UPLOAD_IMAGE_LABEL } from "@/lib/upload-limits";
import { listCatalogItems, setCatalogItemImage } from "@/lib/models/catalog-item";

export interface UploadImageState {
  url?: string;
  error?: string;
}

/** 圖片上傳到 Vercel Blob，固定放在 mymeal/items_images/ 資料夾下，公開存取（access: "public"）
 *  這樣回傳的 blob.url 才能直接存進 imageUrl、讓前台/後台畫面直接讀取。
 *  這支是 ImageField（品項圖片、廣告圖片共用）背後的上傳邏輯：
 *  有帶合法的 itemId（品項表單才有，新增模式是進頁面就先產生好的 pendingItemId）就用它命名，
 *  跟網址列看到的品項 id 一致，方便在 Vercel 的 Blob 檔案總管對應回是哪個品項，
 *  同一個品項重新上傳圖片也會直接覆蓋舊檔（allowOverwrite），不留孤兒檔案
 *  （副檔名改變的情況除外，例如原本 .jpg 換成 .png 上傳）；沒有 itemId（例如廣告圖片）
 *  就照舊用隨機檔名，一樣不會互相覆蓋。 */
export async function uploadItemImageAction(formData: FormData): Promise<UploadImageState> {
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

  try {
    const ext = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : "";
    const filename = `mymeal/items_images/${useItemId ? itemId : crypto.randomUUID()}${ext}`;
    const blob = await put(filename, file, { access: "public", allowOverwrite: useItemId });
    return { url: blob.url };
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
  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  const uploaded: string[] = [];
  const unmatched: string[] = [];
  const errors: string[] = [];
  if (files.length === 0) return { uploaded, unmatched, errors };

  const items = await listCatalogItems();
  const idByName = new Map(items.map((it) => [it.name, it.id]));

  for (const file of files) {
    const dot = file.name.lastIndexOf(".");
    const base = (dot > 0 ? file.name.slice(0, dot) : file.name).trim();
    const ext = dot > 0 ? file.name.slice(dot) : "";

    const itemId = idByName.get(base);
    if (!itemId) {
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
      const filename = `mymeal/items_images/${itemId}${ext}`;
      const blob = await put(filename, file, { access: "public", allowOverwrite: true });
      await setCatalogItemImage(itemId, blob.url);
      uploaded.push(base);
    } catch (err) {
      errors.push(`${file.name}：${err instanceof Error ? err.message : "上傳失敗"}`);
    }
  }

  revalidatePath("/admin/items");
  return { uploaded, unmatched, errors };
}
