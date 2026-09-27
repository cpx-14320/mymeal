"use server";

import { put } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { MAX_UPLOAD_IMAGE_BYTES, MAX_UPLOAD_IMAGE_LABEL } from "@/lib/upload-limits";
import { setMemberAvatar } from "@/lib/models/member";
import { getSessionMemberId } from "@/lib/session";

export interface UploadAvatarState {
  url?: string;
  error?: string;
}

/**
 * 會員自行上傳大頭貼：固定放在 mymeal/profile_picture/ 資料夾下，公開存取，
 * 檔名一律用自己的會員 id 命名（allowOverwrite）——不管挑選的檔案原始檔名是什麼，
 * 同一人重新上傳一律覆蓋舊檔，不會累積出好幾張大頭貼。跟品項圖片上傳是同一套機制，
 * 只是路徑資料夾跟命名來源（會員 id vs. 品項 id）不同，見 admin/items/upload-image-action.ts。
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
    const ext = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : "";
    const filename = `mymeal/profile_picture/${memberId}${ext}`;
    const blob = await put(filename, file, { access: "public", allowOverwrite: true });
    await setMemberAvatar(memberId, blob.url);
    revalidatePath("/account");
    return { url: blob.url };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "上傳失敗，請稍後再試。" };
  }
}
