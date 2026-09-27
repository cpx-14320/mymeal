"use client";

import { useState } from "react";
import JSZip from "jszip";
import { downloadBlob } from "@/lib/csv-export";
import { todayTaiwanDateString, dateToSlug } from "@/lib/date";
import type { CatalogItemView } from "@/lib/models/catalog-item";

export interface ImageZipSummary {
  packed: number;
  skippedNoImage: number;
  failed: string[];
}

/** 圖片網址結尾抓副檔名（去掉 query string／hash），抓不到就當 jpg——zip 裡的檔名終究只是給人看，
 *  副檔名猜錯不影響檔案本身能不能開。 */
function extensionFromUrl(url: string): string {
  const clean = url.split("?")[0].split("#")[0];
  const dot = clean.lastIndexOf(".");
  return dot > -1 && clean.length - dot <= 5 ? clean.slice(dot) : ".jpg";
}

/** 品項名稱理論上不會重複（CSV 匯入就是拿名稱當唯一鍵），但保險起見同名還是加流水號，避免在 zip 裡互相覆蓋。 */
function uniqueFilename(base: string, ext: string, used: Map<string, number>): string {
  const count = used.get(base) ?? 0;
  used.set(base, count + 1);
  return count === 0 ? `${base}${ext}` : `${base}（${count + 1}）${ext}`;
}

/** 打包勾選品項的圖片下載成 ZIP——全程在瀏覽器端做（fetch 圖片網址＋用 JSZip 組檔案），
 *  不經過伺服器，避免選取數量一多就撞到 serverless function 的執行時間／記憶體上限。
 *  圖片來源理論上都是 Vercel Blob 的公開物件（access: "public"，本來就允許前端 fetch 讀取），
 *  但欄位本身也允許手動填外部網址，抓不到的話單張略過、不讓整包失敗。 */
export function ItemsImageZipButton({
  items,
  selectedIds,
  onResult,
}: {
  items: CatalogItemView[];
  selectedIds: string[];
  onResult: (summary: ImageZipSummary) => void;
}) {
  const [pending, setPending] = useState(false);

  async function handleClick() {
    const selected = items.filter((it) => selectedIds.includes(it.id));
    const withImage = selected.filter((it) => it.imageUrl);
    const skippedNoImage = selected.length - withImage.length;

    if (withImage.length === 0) {
      onResult({ packed: 0, skippedNoImage, failed: [] });
      return;
    }

    setPending(true);
    const zip = new JSZip();
    const used = new Map<string, number>();
    const failed: string[] = [];

    await Promise.all(
      withImage.map(async (it) => {
        try {
          const res = await fetch(it.imageUrl!);
          if (!res.ok) throw new Error(String(res.status));
          const blob = await res.blob();
          zip.file(uniqueFilename(it.name, extensionFromUrl(it.imageUrl!), used), blob);
        } catch {
          failed.push(it.name);
        }
      }),
    );

    const packed = withImage.length - failed.length;
    if (packed > 0) {
      const blob = await zip.generateAsync({ type: "blob" });
      downloadBlob(`品項圖片_${dateToSlug(todayTaiwanDateString())}.zip`, blob);
    }

    setPending(false);
    onResult({ packed, skippedNoImage, failed });
  }

  return (
    <button
      type="button"
      disabled={pending || selectedIds.length === 0}
      onClick={handleClick}
      className="rounded-lg border border-line px-3 py-1 font-semibold text-ink hover:bg-surface disabled:opacity-50"
    >
      {pending ? "打包中…" : "下載圖片（ZIP）"}
    </button>
  );
}
