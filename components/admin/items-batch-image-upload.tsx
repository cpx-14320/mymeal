"use client";

import { useRef, useTransition, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { buttonClass } from "@/components/ui/primitives";
import {
  batchUploadItemImagesAction,
  type BatchUploadImagesResult,
} from "@/app/(app)/admin/items/upload-image-action";

/** 批次上傳品項圖片：一次選多張圖片，檔名（去除副檔名）要跟品項名稱一模一樣才會比對成功——
 *  跟品項匯出的 CSV「品項名稱」欄位是同一個名稱，所以先匯出 CSV、依名稱整理好圖片檔名，
 *  再回來這裡批次上傳，是預期的使用流程。 */
export function ItemsBatchImageUpload({ onResult }: { onResult: (result: BatchUploadImagesResult) => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = [...(e.target.files ?? [])];
    e.target.value = ""; // 讓同一批檔案可以重選一次、再次觸發 onChange
    if (files.length === 0) return;

    const formData = new FormData();
    for (const file of files) formData.append("files", file);

    startTransition(async () => {
      const res = await batchUploadItemImagesAction(formData);
      onResult(res);
      router.refresh();
    });
  }

  return (
    <label className={buttonClass("secondary", "sm")}>
      {pending ? "上傳中…" : "批次上傳圖片"}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        disabled={pending}
        onChange={handleFiles}
      />
    </label>
  );
}
