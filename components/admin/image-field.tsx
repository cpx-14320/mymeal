"use client";

import { useRef, useState, useTransition, type ChangeEvent } from "react";
import { inputClass } from "@/components/ui/primitives";
import { uploadItemImageAction } from "@/app/(app)/admin/items/upload-image-action";

/**
 * 品項圖片欄位：可手動輸入圖片路徑 / 網址，或從本機選擇檔案直接上傳到 Vercel Blob
 * （mymeal/items_images/ 資料夾，公開存取）。選檔後先顯示本機預覽，上傳成功再把
 * 回傳的公開網址寫進 imageUrl 文字欄位（表單實際送出的就是這個欄位）。
 */
export function ImageField({
  label = "品項圖片",
  defaultPath,
  fallbackEmoji,
  placeholder = "/uploads/items/xxx.jpg 或完整網址",
}: {
  label?: string;
  defaultPath?: string;
  fallbackEmoji?: string;
  placeholder?: string;
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
    setFilePreview(URL.createObjectURL(f));

    const formData = new FormData();
    formData.append("file", f);
    startUpload(async () => {
      const result = await uploadItemImageAction(formData);
      if (result.error) {
        setUploadError(result.error);
        return;
      }
      if (result.url) setPath(result.url);
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
        <div className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-surface-2">
          {showImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={`${label}預覽`}
              className="size-full object-cover"
              onError={() => setBroken(true)}
            />
          ) : (
            <span className="text-3xl">{fallbackEmoji || "🍽️"}</span>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
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

          <div className="flex flex-wrap items-center gap-2">
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

          {uploadError && <p className="text-[13px] lg:text-[14px] text-danger">{uploadError}</p>}

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
