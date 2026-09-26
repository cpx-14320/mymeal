"use client";

import { useRef, useState, useTransition, type ChangeEvent } from "react";
import { inputClass } from "@/components/ui/primitives";
import { uploadItemImageAction } from "@/app/(app)/admin/items/upload-image-action";
import { MAX_UPLOAD_IMAGE_BYTES, MAX_UPLOAD_IMAGE_LABEL } from "@/lib/upload-limits";

/**
 * 品項圖片欄位：可手動輸入圖片路徑 / 網址，或從本機選擇檔案直接上傳到 Vercel Blob
 * （mymeal/items_images/ 資料夾，公開存取）。選檔後先顯示本機預覽，上傳成功再把
 * 回傳的公開網址寫進 imageUrl 文字欄位（表單實際送出的就是這個欄位）。
 * itemId：有傳的話檔名就用這個 id 命名（品項用法是新增模式下進頁面就先產生好的
 * pendingItemId），跟網址列看到的 id 一致，好對應、也不會跟其他資料的圖片撞名；
 * 沒傳（例如廣告圖片沒有這種「先產生好 id」的流程）就照舊用隨機檔名。
 * onUploadingChange：讓外層表單知道圖片還在上傳中——上傳是選檔當下就自己觸發的
 * 獨立 action（跟外層表單「儲存」是分開送出的兩件事），如果沒有這個通知，使用者
 * 選完圖片馬上按儲存，很可能上傳網址還沒回來、imageUrl 欄位還是舊值，表單卻已經送出，
 * 看起來就像「上傳了圖片，但沒有更新成功」；外層應該用這個把儲存按鈕暫時停用。
 */
export function ImageField({
  itemId,
  label = "品項圖片",
  defaultPath,
  fallbackEmoji,
  placeholder = "/uploads/items/xxx.jpg 或完整網址",
  onUploadingChange,
}: {
  itemId?: string;
  label?: string;
  defaultPath?: string;
  fallbackEmoji?: string;
  placeholder?: string;
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const [path, setPath] = useState(defaultPath ?? "");
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [broken, setBroken] = useState(false);
  const [uploading, startUpload] = useTransition();
  const [uploadError, setUploadError] = useState<string | undefined>();
  const fileRef = useRef<HTMLInputElement>(null);

  const src = filePreview ?? (path.trim() ? path.trim() : null);
  const showImage = src !== null && !broken;

  function onFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);
    setBroken(false);
    setUploadError(undefined);

    // 先在本機檢查大小——檔案太大時，Server Action 本身的請求大小上限會讓整個
    // 呼叫直接失敗（拿到的是很籠統的網路錯誤，不是我們自己寫的訊息），所以在送出前
    // 就先擋下來，直接顯示明確原因，不用等一趟網路來回才發現。
    if (f.size > MAX_UPLOAD_IMAGE_BYTES) {
      setUploadError(`圖片檔案過大（超過 ${MAX_UPLOAD_IMAGE_LABEL}），請壓縮後再上傳。`);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    setFilePreview(URL.createObjectURL(f));

    const formData = new FormData();
    formData.append("file", f);
    if (itemId) formData.append("itemId", itemId);
    onUploadingChange?.(true);
    startUpload(async () => {
      try {
        const result = await uploadItemImageAction(formData);
        if (result.error) {
          setUploadError(result.error);
          return;
        }
        if (result.url) setPath(result.url);
      } catch {
        // Server Action 呼叫本身丟出例外（不是我們自己 return 的 { error }），
        // 常見原因就是請求大小超過框架上限——上面已經用 MAX_UPLOAD_IMAGE_BYTES 擋掉多數情況，
        // 這裡是最後一道保底，訊息也順便講出最可能的原因。
        setUploadError(`上傳失敗，請確認圖片檔案未超過 ${MAX_UPLOAD_IMAGE_LABEL} 或稍後再試。`);
      } finally {
        onUploadingChange?.(false);
      }
    });
  }

  function clear() {
    setPath("");
    setFilePreview(null);
    setFileName(null);
    setBroken(false);
    setUploadError(undefined);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <div className="flex gap-4">
        <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-surface-2">
          {showImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={`${label}預覽`}
              className="size-full object-cover"
              onError={() => setBroken(true)}
            />
          ) : (
            <span className="text-lg">{fallbackEmoji || "🍽️"}</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <input
            name="imageUrl"
            className={inputClass}
            value={path}
            onChange={(e) => {
              setPath(e.target.value);
              setBroken(false);
            }}
            placeholder={placeholder}
          />

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm hover:bg-surface-2 disabled:opacity-50"
            >
              {uploading ? "上傳中…" : "從本機選擇檔案"}
            </button>
            {fileName && !uploading && (
              <span className="max-w-52 truncate text-[13px] lg:text-[14px] text-muted">
                {fileName}
              </span>
            )}
            {(filePreview || path) && (
              <button
                type="button"
                onClick={clear}
                className="text-[13px] lg:text-[14px] text-muted hover:text-danger"
              >
                清除
              </button>
            )}
          </div>

          {uploadError && <p className="mt-2 text-[13px] lg:text-[14px] text-danger">{uploadError}</p>}

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onFile}
          />
        </div>
      </div>
    </div>
  );
}
