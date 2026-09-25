"use server";

import { put } from "@vercel/blob";

export interface UploadImageState {
  url?: string;
  error?: string;
}

/** 品項圖片上傳到 Vercel Blob，固定放在 mymeal/items_images/ 資料夾下，公開存取（access: "public"）
 *  這樣回傳的 blob.url 才能直接存進 imageUrl、讓前台/後台畫面直接讀取。 */
export async function uploadItemImageAction(formData: FormData): Promise<UploadImageState> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "沒有選到檔案。" };
  }
  if (!file.type.startsWith("image/")) {
    return { error: "請選擇圖片檔案。" };
  }

  try {
    const ext = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : "";
    const filename = `mymeal/items_images/${crypto.randomUUID()}${ext}`;
    const blob = await put(filename, file, { access: "public" });
    return { url: blob.url };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "上傳失敗，請稍後再試。" };
  }
}
