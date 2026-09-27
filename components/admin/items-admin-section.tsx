"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Section, ButtonLink, DismissibleNote } from "@/components/ui/primitives";
import { AdminHeaderActions } from "@/components/layout/admin-header-actions";
import { ItemsTable } from "@/components/admin/items-table";
import { ItemsCsvButtons } from "@/components/admin/items-csv-buttons";
import { ItemsBatchImageUpload } from "@/components/admin/items-batch-image-upload";
import type { ItemImportSummary } from "@/app/(app)/admin/items/actions";
import type { BatchUploadImagesResult } from "@/app/(app)/admin/items/upload-image-action";
import type { ImageZipSummary } from "@/components/admin/items-image-zip-button";
import type { CatalogItemView } from "@/lib/models/catalog-item";
import type { ItemCategoryOption } from "@/lib/models/item-category";
import type { TagGroupView } from "@/lib/models/tag-group";
import type { PageView } from "@/lib/models/page";

type Message = { tone: "positive" | "danger"; content: React.ReactNode };

function csvResultMessage(summary: ItemImportSummary): Message {
  const hasIssue = summary.errors.length > 0;
  return {
    tone: hasIssue ? "danger" : "positive",
    content: (
      <>
        <p>新增 {summary.created} 筆，更新 {summary.updated} 筆。</p>
        {(summary.categoriesCreated.length > 0 ||
          summary.tagGroupsCreated.length > 0 ||
          summary.tagOptionsCreated.length > 0) && (
          <ul className="mt-1 max-h-32 list-disc space-y-0.5 overflow-y-auto pl-4">
            {summary.categoriesCreated.map((name, i) => (
              <li key={`cat-${i}`}>已自動建立分類「{name}」</li>
            ))}
            {summary.tagGroupsCreated.map((name, i) => (
              <li key={`grp-${i}`}>已自動建立標籤群組「{name}」</li>
            ))}
            {summary.tagOptionsCreated.map((label, i) => (
              <li key={`opt-${i}`}>已自動新增標籤選項「{label}」</li>
            ))}
          </ul>
        )}
        {summary.errors.length > 0 && (
          <ul className="mt-1 max-h-40 list-disc space-y-0.5 overflow-y-auto pl-4">
            {summary.errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        )}
      </>
    ),
  };
}

function batchUploadResultMessage(result: BatchUploadImagesResult): Message {
  const hasIssue = result.unmatched.length > 0 || result.errors.length > 0;
  return {
    tone: hasIssue ? "danger" : "positive",
    content: (
      <>
        <p>成功更新 {result.uploaded.length} 筆品項圖片。</p>
        {result.unmatched.length > 0 && (
          <div className="mt-1">
            <p>找不到對應品項名稱（{result.unmatched.length}）：</p>
            <ul className="max-h-32 list-disc space-y-0.5 overflow-y-auto pl-4">
              {result.unmatched.map((name, i) => (
                <li key={i}>{name}</li>
              ))}
            </ul>
          </div>
        )}
        {result.errors.length > 0 && (
          <ul className="mt-1 max-h-40 list-disc space-y-0.5 overflow-y-auto pl-4">
            {result.errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        )}
      </>
    ),
  };
}

function zipResultMessage(summary: ImageZipSummary): Message {
  return {
    tone: summary.failed.length > 0 ? "danger" : "positive",
    content: (
      <>
        <p>
          成功打包 {summary.packed} 張圖片
          {summary.skippedNoImage > 0 && `，${summary.skippedNoImage} 項沒有圖片已略過`}。
        </p>
        {summary.failed.length > 0 && (
          <div className="mt-1">
            <p>下載失敗（{summary.failed.length}）：</p>
            <ul className="max-h-32 list-disc space-y-0.5 overflow-y-auto pl-4">
              {summary.failed.map((name, i) => (
                <li key={i}>{name}</li>
              ))}
            </ul>
          </div>
        )}
      </>
    ),
  };
}

export function ItemsAdminSection({
  items,
  categories,
  tagGroups,
  pages,
  justCreated = false,
}: {
  items: CatalogItemView[];
  categories: ItemCategoryOption[];
  tagGroups: TagGroupView[];
  pages: PageView[];
  /** 新增品項存檔後帶著 ?created=1 導回這頁——進來就跳成功訊息，並把網址列的參數清掉，
   *  避免使用者重新整理這一頁時又跳出一次「新增成功」。 */
  justCreated?: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<Message | null>(
    justCreated ? { tone: "positive", content: <p>新增品項成功。</p> } : null,
  );

  useEffect(() => {
    if (justCreated) router.replace("/admin/items");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Section>
      <AdminHeaderActions>
        <ItemsCsvButtons items={items} tagGroups={tagGroups} onResult={(s) => setMessage(csvResultMessage(s))} />
        <ItemsBatchImageUpload onResult={(r) => setMessage(batchUploadResultMessage(r))} />
        <ButtonLink href="/admin/items/new" size="sm">新增品項</ButtonLink>
      </AdminHeaderActions>

      {message && (
        <DismissibleNote tone={message.tone} onClose={() => setMessage(null)}>
          {message.content}
        </DismissibleNote>
      )}

      <ItemsTable
        items={items}
        categories={categories}
        tagGroups={tagGroups}
        pages={pages}
        onZipResult={(s) => setMessage(zipResultMessage(s))}
        onDeleted={(count) =>
          setMessage({ tone: "positive", content: <p>已刪除 {count} 項品項。</p> })
        }
      />
    </Section>
  );
}
