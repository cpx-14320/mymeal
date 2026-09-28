"use server";

import { revalidatePath } from "next/cache";
import { MAX_UPLOAD_IMAGE_BYTES, MAX_UPLOAD_IMAGE_LABEL } from "@/lib/upload-limits";
import { uploadKeyedImage } from "@/lib/blob-upload";
import { getMemberAvatarUrl, setMemberAvatar } from "@/lib/models/member";
import { getSessionMemberId } from "@/lib/session";

export interface UploadAvatarState {
  url?: string;
  error?: string;
}

/**
 * 會員自行上傳大頭貼：固定放在 mymeal/profile_picture/ 資料夾下，公開存取，
 * 檔名一律用自己的會員 id 命名——不管挑選的檔案原始檔名是什麼，同一人重新上傳一律覆蓋舊檔；
 * 換一張副檔名不同的圖也不會留下孤兒檔案（見 lib/blob-upload.ts 的 uploadKeyedImage，
 * 會先清掉副檔名不同的舊檔）。跟品項圖片上傳是同一套機制，只是路徑資料夾跟命名來源
 * （會員 id vs. 品項 id）不同，見 admin/items/upload-image-action.ts。
 */
export async function uploadAvatarAction(formData: FormData): Promise<UploadAvatarState> {
  const memberId = await getSessionMemberId();
  if (!memberId) return { error: "請先登入。" };

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

  try {
    const previousUrl = await getMemberAvatarUrl(memberId);
    const url = await uploadKeyedImage({
      folder: "mymeal/profile_picture",
      key: memberId,
      file,
      previousUrl,
    });
    await setMemberAvatar(memberId, url);
    revalidatePath("/account");
    return { url };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "上傳失敗，請稍後再試。" };
  }
}
