"use client";

import { useRef, useState, useTransition, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { uploadAvatarAction } from "@/app/(app)/account/actions";
import { MAX_UPLOAD_IMAGE_BYTES, MAX_UPLOAD_IMAGE_LABEL } from "@/lib/upload-limits";

/** 會員中心的大頭貼上傳：點圓形預覽或旁邊的文字按鈕選檔後立即上傳並直接生效，
 *  不用另外走表單「儲存」流程；成功後 router.refresh() 讓 header 的頭像也跟著換新。 */
export function AccountAvatarUploader({
  initialAvatarUrl,
  name,
  role,
}: {
  initialAvatarUrl?: string;
  name: string;
  role: string;
}) {
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, startUpload] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const fileRef = useRef<HTMLInputElement>(null);

  const src = preview ?? avatarUrl;

  function onFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setError(undefined);

    if (f.size > MAX_UPLOAD_IMAGE_BYTES) {
      setError(`圖片檔案過大（超過 ${MAX_UPLOAD_IMAGE_LABEL}），請壓縮後再上傳。`);
      return;
    }

    setPreview(URL.createObjectURL(f));
    const formData = new FormData();
    formData.append("file", f);
    startUpload(async () => {
      const result = await uploadAvatarAction(formData);
      if (result.error) {
        setError(result.error);
        setPreview(null);
        return;
      }
      if (result.url) setAvatarUrl(result.url);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="group relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-full bg-brand-soft text-2xl disabled:opacity-60"
        aria-label="上傳大頭貼"
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="大頭貼" className="size-full object-cover" />
        ) : (
          "🙂"
        )}
        <span className="absolute inset-0 hidden items-center justify-center bg-black/40 text-[11px] font-medium text-white group-hover:flex">
          {uploading ? "上傳中…" : "更換"}
        </span>
      </button>

      <div>
        <p className="text-lg font-bold">{name}</p>
        <p className="text-sm text-muted">{role}</p>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="mt-1 text-[13px] font-medium text-brand hover:underline disabled:opacity-60"
        >
          {uploading ? "上傳中…" : "上傳大頭貼"}
        </button>
        {error && <p className="mt-1 text-[13px] text-danger">{error}</p>}
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
    </div>
  );
}
