"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { inputClass } from "@/components/ui/primitives";

/**
 * 品項圖片欄位：可手動輸入圖片路徑 / 網址，或從本機選擇檔案。
 * 目前為介面預覽：選檔只做本機預覽（URL.createObjectURL），
 * 接後端後改為實際上傳並把回傳的路徑寫進 imageUrl。
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
  const fileRef = useRef<HTMLInputElement>(null);

  const src = filePreview ?? (path.trim() ? path.trim() : null);
  const showImage = src !== null && !broken;

  function onFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);
    setBroken(false);
    setFilePreview(URL.createObjectURL(f));
  }

  function clear() {
    setPath("");
    setFilePreview(null);
    setFileName(null);
    setBroken(false);
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
              onClick={() => fileRef.current?.click()}
              className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm hover:bg-surface-2"
            >
              從本機選擇檔案
            </button>
            {fileName && (
              <span className="max-w-52 truncate text-xs text-muted">
                {fileName}
              </span>
            )}
            {(filePreview || path) && (
              <button
                type="button"
                onClick={clear}
                className="text-xs text-muted hover:text-danger"
              >
                清除
              </button>
            )}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onFile}
          />

          <p className="text-xs text-muted">
            接後端後：選檔會實際上傳，圖片路徑自動填入。沒有圖片時，清單以備用 emoji 顯示。
          </p>
        </div>
      </div>
    </div>
  );
}
