"use client";

import { useRef, useState, useTransition, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { buttonClass } from "@/components/ui/primitives";
import { downloadCsv, parseCsv } from "@/lib/csv-export";
import { todayTaiwanDateString, dateToSlug } from "@/lib/date";
import type { CatalogItemView } from "@/lib/models/catalog-item";
import type { TagGroupView } from "@/lib/models/tag-group";
import { tagGroupValue } from "@/components/admin/items-table";
import { importItemsAction, type ItemImportSummary } from "@/app/(app)/admin/items/actions";

const FIXED_COLUMNS = ["Emoji", "品項名稱", "品項圖片", "頁面", "分類", "價錢", "狀態"] as const;

/** 欄位順序跟畫面上的品項設定表格一致：Emoji、品項名稱、品項圖片、頁面、分類、（各標籤群組……）、價錢、狀態。
 *  標籤群組是動態欄——有幾組（肉類/主食…）就幾欄，順序照「類別設定」頁目前排的順序走。
 *  品項圖片目前只是存路徑字串（跟品項編輯頁的圖片欄位一樣），還沒有實際的圖片上傳/託管後端。 */
function csvHeaders(tagGroups: TagGroupView[]) {
  return ["Emoji", "品項名稱", "品項圖片", "頁面", "分類", ...tagGroups.map((g) => g.name), "價錢", "狀態"];
}

function exportItemsCsv(items: CatalogItemView[], tagGroups: TagGroupView[]) {
  downloadCsv(
    `品項總表_${dateToSlug(todayTaiwanDateString())}.csv`,
    csvHeaders(tagGroups),
    items.map((it) => [
      it.emoji,
      it.name,
      it.imageUrl ?? "",
      it.pageName ?? "",
      it.categoryName,
      ...tagGroups.map((g) => tagGroupValue(it.tags, g)),
      it.price,
      it.active ? "啟用" : "停用",
    ]),
  );
}

/** 匯入解析改成「照欄名對應」而不是「照第幾欄」——這樣匯入端不管目前有沒有這些標籤群組都能正確
 *  讀到資料（欄名本身就是群組名稱），CSV 裡認不出的欄一律當成標籤群組欄，找不到對應群組就自動建立。 */
function parseImportRows(text: string) {
  const [header, ...dataRows] = parseCsv(text);
  if (!header) return [];

  const indexOf = (name: string) => header.findIndex((h) => h.trim() === name);
  const fixedIdx = {
    emoji: indexOf("Emoji"),
    name: indexOf("品項名稱"),
    imageUrl: indexOf("品項圖片"),
    page: indexOf("頁面"),
    category: indexOf("分類"),
    price: indexOf("價錢"),
    active: indexOf("狀態"),
  };
  const knownIdx = new Set(Object.values(fixedIdx).filter((i) => i >= 0));
  const tagGroupColumns = header
    .map((h, i) => ({ groupName: h.trim(), i }))
    .filter(({ groupName, i }) => groupName && !knownIdx.has(i) && !(FIXED_COLUMNS as readonly string[]).includes(groupName));

  return dataRows.map((cells) => ({
    emoji: (cells[fixedIdx.emoji] ?? "").trim() || "🍽️",
    name: (cells[fixedIdx.name] ?? "").trim(),
    imageUrl: (cells[fixedIdx.imageUrl] ?? "").trim() || undefined,
    pageName: (cells[fixedIdx.page] ?? "").trim() || undefined,
    categoryName: (cells[fixedIdx.category] ?? "").trim(),
    tagsByGroup: tagGroupColumns.map(({ groupName, i }) => ({ groupName, value: (cells[i] ?? "").trim() })),
    price: Number(cells[fixedIdx.price]) || 0,
    active: (cells[fixedIdx.active] ?? "").trim() !== "停用",
  }));
}

export function ItemsCsvButtons({ items, tagGroups }: { items: CatalogItemView[]; tagGroups: TagGroupView[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [summary, setSummary] = useState<ItemImportSummary | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // 讓同一個檔案可以重選一次、再次觸發 onChange
    if (!file) return;

    const text = await file.text();
    const rows = parseImportRows(text);

    startTransition(async () => {
      const result = await importItemsAction(rows);
      setSummary(result);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className={buttonClass("secondary", "sm")}
        onClick={() => exportItemsCsv(items, tagGroups)}
      >
        匯出 CSV
      </button>
      <label className={buttonClass("secondary", "sm")}>
        {pending ? "匯入中…" : "匯入 CSV"}
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          disabled={pending}
          onChange={handleFile}
        />
      </label>

      {summary && (
        <div className="fixed right-4 top-4 z-50 w-80 space-y-2 rounded-lg border border-line bg-surface p-4 text-sm shadow-lg">
          <div className="flex items-center justify-between">
            <p className="font-semibold">匯入結果</p>
            <button
              type="button"
              onClick={() => setSummary(null)}
              className="text-muted hover:text-ink"
              aria-label="關閉"
            >
              ✕
            </button>
          </div>
          <p className="text-muted">
            新增 {summary.created} 筆，更新 {summary.updated} 筆。
          </p>
          {(summary.categoriesCreated.length > 0 ||
            summary.tagGroupsCreated.length > 0 ||
            summary.tagOptionsCreated.length > 0) && (
            <ul className="max-h-32 list-disc space-y-0.5 overflow-y-auto pl-4 text-muted">
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
            <ul className="max-h-40 list-disc space-y-0.5 overflow-y-auto pl-4 text-danger">
              {summary.errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
