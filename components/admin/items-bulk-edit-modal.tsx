"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal, ModalHeader } from "@/components/ui/modal";
import { Field, inputClass, Button } from "@/components/ui/primitives";
import { bulkPatchItemsAction, type BulkItemPatch } from "@/app/(app)/admin/items/actions";
import type { ItemCategoryOption } from "@/lib/models/item-category";
import type { TagGroupView } from "@/lib/models/tag-group";
import type { PageView } from "@/lib/models/page";

const NO_CHANGE = "";
const UNSET_PAGE = "__unset__";
const CLEAR_TAG = "__clear__";

/** 品項設定「批次編輯」彈窗——頁面／分類／各標籤群組／價錢，每個欄位預設「不變」，
 *  只有實際選了值（或清空）的欄位才會送出去改，其餘選取的品項該欄位維持原樣不動。
 *  跟 items-table.tsx 既有的單列 inline 編輯是兩回事：那個一次只改一列、一定有明確的新值；
 *  這裡是多選之後一次改一批，需要「不變」這個第三種狀態，所以拆成獨立的共用彈窗元件。 */
export function ItemsBulkEditModal({
  ids,
  pages,
  categories,
  tagGroups,
  onClose,
  onApplied,
}: {
  ids: string[];
  pages: PageView[];
  categories: ItemCategoryOption[];
  tagGroups: TagGroupView[];
  onClose: () => void;
  onApplied: () => void;
}) {
  const router = useRouter();
  const [pageValue, setPageValue] = useState(NO_CHANGE);
  const [categoryValue, setCategoryValue] = useState(NO_CHANGE);
  const [tagValues, setTagValues] = useState<Record<string, string>>({});
  const [priceValue, setPriceValue] = useState("");
  const [pending, setPending] = useState(false);

  async function handleApply() {
    const patch: BulkItemPatch = {};
    if (pageValue !== NO_CHANGE) patch.pageId = pageValue === UNSET_PAGE ? "" : pageValue;
    if (categoryValue !== NO_CHANGE) patch.categoryId = categoryValue;

    const tagPatches = Object.entries(tagValues)
      .filter(([, v]) => v !== NO_CHANGE)
      .map(([groupId, v]) => ({ groupId, value: v === CLEAR_TAG ? "" : v }));
    if (tagPatches.length > 0) patch.tagGroups = tagPatches;

    if (priceValue.trim() !== "") {
      const n = Number(priceValue);
      if (Number.isFinite(n) && n >= 0) patch.price = n;
    }

    if (Object.keys(patch).length === 0) {
      onClose();
      return;
    }

    setPending(true);
    await bulkPatchItemsAction(ids, patch);
    setPending(false);
    onApplied();
    router.refresh();
  }

  return (
    <Modal open onClose={onClose} ariaLabel="批次編輯品項" className="max-w-lg">
      <ModalHeader title={`批次編輯（已選 ${ids.length} 項）`} subtitle="只有選了值的欄位才會套用，其餘維持原樣。" onClose={onClose} />
      <div className="space-y-4 overflow-y-auto p-4">
        <Field label="頁面">
          <select className={inputClass} value={pageValue} onChange={(e) => setPageValue(e.target.value)}>
            <option value={NO_CHANGE}>不變</option>
            <option value={UNSET_PAGE}>（取消掛頁面）</option>
            {pages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="分類">
          <select className={inputClass} value={categoryValue} onChange={(e) => setCategoryValue(e.target.value)}>
            <option value={NO_CHANGE}>不變</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>

        {tagGroups.map((g) => (
          <Field key={g.id} label={g.name}>
            <select
              className={inputClass}
              value={tagValues[g.id] ?? NO_CHANGE}
              onChange={(e) => setTagValues((prev) => ({ ...prev, [g.id]: e.target.value }))}
            >
              <option value={NO_CHANGE}>不變</option>
              <option value={CLEAR_TAG}>（清空）</option>
              {g.options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </Field>
        ))}

        <Field label="價錢">
          <input
            className={inputClass}
            type="number"
            min={0}
            step={5}
            placeholder="不變"
            value={priceValue}
            onChange={(e) => setPriceValue(e.target.value)}
          />
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={pending}>
            取消
          </Button>
          <Button type="button" onClick={handleApply} disabled={pending}>
            {pending ? "套用中…" : "套用變更"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
