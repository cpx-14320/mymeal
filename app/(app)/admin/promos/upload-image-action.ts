"use server";

import { MAX_UPLOAD_IMAGE_BYTES, MAX_UPLOAD_IMAGE_LABEL } from "@/lib/upload-limits";
import { uploadKeyedImage } from "@/lib/blob-upload";
import type { UploadImageState } from "@/app/(app)/admin/items/upload-image-action";
import { requireAdminPermission } from "@/lib/admin-guard";

/** 蓋台廣告圖片上傳，固定放在 mymeal/pop_up/ 資料夾下，公開存取——跟品項圖片
 *  （admin/items/upload-image-action.ts）同一套機制，只是資料夾跟命名來源換成廣告自己的 id：
 *  有帶合法的 id（新增模式是進頁面就先產生好的 pendingPromoId，見 new/page.tsx）就用它命名，
 *  同一則廣告重新上傳圖片會直接覆蓋舊檔；換一張副檔名不同的圖也不會留下孤兒檔案
 *  （見 lib/blob-upload.ts 的 uploadKeyedImage，會先清掉副檔名不同的舊檔）；
 *  沒有合法 id 就照舊用隨機檔名，一樣不會互相覆蓋。 */
export async function uploadPromoImageAction(formData: FormData): Promise<UploadImageState> {
  try {
    await requireAdminPermission("promos");
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
  const promoId = String(formData.get("itemId") ?? "");
  const usePromoId = /^[a-f0-9]{24}$/i.test(promoId);
  const previousUrl = String(formData.get("previousUrl") ?? "").trim() || undefined;

  try {
    const url = await uploadKeyedImage({
      folder: "mymeal/pop_up",
      key: usePromoId ? promoId : crypto.randomUUID(),
      file,
      previousUrl: usePromoId ? previousUrl : undefined,
    });
    return { url };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "上傳失敗，請稍後再試。" };
  }
}
