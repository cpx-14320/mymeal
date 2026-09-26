"use server";

import { put } from "@vercel/blob";
import { MAX_UPLOAD_IMAGE_BYTES, MAX_UPLOAD_IMAGE_LABEL } from "@/lib/upload-limits";

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
