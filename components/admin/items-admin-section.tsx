"use client";

import { useState } from "react";
import { Section, ButtonLink, Note } from "@/components/ui/primitives";
import { AdminHeaderActions } from "@/components/layout/admin-header-actions";
import { ItemsTable } from "@/components/admin/items-table";
import { ItemsCsvButtons } from "@/components/admin/items-csv-buttons";
import { ItemsBatchImageUpload } from "@/components/admin/items-batch-image-upload";
import type { ItemImportSummary } from "@/app/(app)/admin/items/actions";
import type { BatchUploadImagesResult } from "@/app/(app)/admin/items/upload-image-action";
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

export function ItemsAdminSection({
  items,
  categories,
  tagGroups,
  pages,
}: {
  items: CatalogItemView[];
  categories: ItemCategoryOption[];
  tagGroups: TagGroupView[];
  pages: PageView[];
}) {
  const [message, setMessage] = useState<Message | null>(null);

  return (
    <Section>
      <AdminHeaderActions>
        <ItemsCsvButtons items={items} tagGroups={tagGroups} onResult={(s) => setMessage(csvResultMessage(s))} />
        <ItemsBatchImageUpload onResult={(r) => setMessage(batchUploadResultMessage(r))} />
        <ButtonLink href="/admin/items/new" size="sm">新增品項</ButtonLink>
      </AdminHeaderActions>

      {message && (
        <Note tone={message.tone}>
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">{message.content}</div>
            <button
              type="button"
              onClick={() => setMessage(null)}
              className="shrink-0 opacity-70 hover:opacity-100"
              aria-label="關閉"
            >
              ✕
            </button>
          </div>
        </Note>
      )}

      <ItemsTable items={items} categories={categories} tagGroups={tagGroups} pages={pages} />
    </Section>
  );
}
