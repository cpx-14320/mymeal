import { put, del } from "@vercel/blob";

export interface UploadKeyedImageInput {
  /** Blob 路徑前綴，例如 "mymeal/items_images"。 */
  folder: string;
  /** 這筆資料自己的 id，當檔名（不含副檔名）用——同一個 key 永遠只對應一個檔案。 */
  key: string;
  file: File;
  /** 這筆資料目前的圖片網址（存檔案還沒被這次上傳取代前的值），有的話才需要判斷要不要清舊檔。 */
  previousUrl?: string;
}

/**
 * 品項圖片、廣告圖片、會員大頭貼共用的上傳邏輯：檔名固定用資料自己的 id 命名，
 * allowOverwrite 讓「副檔名沒變」的重新上傳直接覆蓋舊檔。
 * 但 allowOverwrite 只在路徑（含副檔名）完全相同時才有效——如果這次上傳的檔案副檔名
 * 跟舊圖不一樣（例如原本 .jpg 這次換 .png），新檔案會另外存成一個新路徑，舊的 .jpg
 * 不會自動消失，同一筆資料就會在 Blob 空間裡留下兩個檔案。這裡在上傳新檔之前，
 * 先比對舊網址的路徑，副檔名確實不同的話就先刪掉舊檔，確保同一個 key 底下永遠只留一個檔案。
 */
export async function uploadKeyedImage({
  folder,
  key,
  file,
  previousUrl,
}: UploadKeyedImageInput): Promise<string> {
  const ext = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : "";
  const filename = `${folder}/${key}${ext}`;

  if (previousUrl) {
    try {
      const oldPath = decodeURIComponent(new URL(previousUrl).pathname).replace(/^\//, "");
      if (oldPath && oldPath !== filename) await del(previousUrl);
    } catch {
      // 舊網址不是合法網址（例如手動貼的站內相對路徑）或刪除失敗，不影響這次上傳，忽略即可。
    }
  }

  const blob = await put(filename, file, { access: "public", allowOverwrite: true });
  return blob.url;
}
