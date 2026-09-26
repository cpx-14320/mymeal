"use client";

import { useActionState, useState } from "react";
import { Card, CardBody, Field, inputClass, Button, ButtonLink } from "@/components/ui/primitives";
import { ImageField } from "@/components/admin/image-field";
import type { CatalogItemView } from "@/lib/models/catalog-item";
import type { ItemCategoryOption } from "@/lib/models/item-category";
import type { PageView } from "@/lib/models/page";
import type { TagGroupView } from "@/lib/models/tag-group";
import { createItemAction, type CreateItemState } from "@/app/(app)/admin/items/new/actions";
import { updateItemAction, type UpdateItemState } from "@/app/(app)/admin/items/[id]/actions";

/** 新增 / 編輯品項共用的表單。傳 item 就是編輯模式（欄位帶入現值）。
 *  pendingItemId：新增模式下，進頁面就先產生好的品項 id（見 new/page.tsx），
 *  讓圖片選檔當下上傳就能用「未來這個品項的 id」命名，不用等存檔後才知道 id。 */
export function ItemForm({
  item,
  categories,
  pages,
  tagGroups,
  pendingItemId,
}: {
  item?: CatalogItemView;
  categories: ItemCategoryOption[];
  pages: PageView[];
  tagGroups: TagGroupView[];
  pendingItemId?: string;
}) {
  const isEdit = !!item;
  const action = isEdit ? updateItemAction.bind(null, item.id) : createItemAction;
  const [state, formAction, pending] = useActionState<CreateItemState | UpdateItemState, FormData>(
    action,
    {},
  );
  const itemId = item?.id ?? pendingItemId!;
  const [imageUploading, setImageUploading] = useState(false);

  return (
    <form action={formAction}>
      <Card>
        <CardBody className="space-y-5">
          {!isEdit && <input type="hidden" name="pendingItemId" value={pendingItemId} />}
          <ImageField
            itemId={itemId}
            defaultPath={item?.imageUrl}
            fallbackEmoji={item?.emoji}
            onUploadingChange={setImageUploading}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="品項名稱">
              <input className={inputClass} name="name" defaultValue={item?.name} placeholder="例：招牌雞腿飯" required />
            </Field>

            <Field label="備用圖示Emoji">
              <input className={inputClass} name="emoji" maxLength={4} defaultValue={item?.emoji} placeholder="🍗" />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="頁面">
              <select className={inputClass} name="pageId" defaultValue={item?.pageId ?? ""}>
                <option value="">選擇頁面</option>
                {pages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="分類">
              <select className={inputClass} name="categoryId" defaultValue={item?.categoryId ?? ""} required>
                <option value="" disabled>
                  選擇分類
                </option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="價格（NT$）">
              <input
                className={inputClass}
                type="number"
                name="price"
                min={0}
                step={5}
                defaultValue={item?.price}
                placeholder="25"
                required
              />
            </Field>

            <Field label="狀態">
              <select className={inputClass} name="active" defaultValue={(item?.active ?? true) ? "true" : "false"}>
                <option value="true">啟用</option>
                <option value="false">停用</option>
              </select>
            </Field>
          </div>

          <div>
            <span className="mb-1 block text-sm font-medium">標籤</span>
            <p className="mb-2 text-[13px] lg:text-[14px] text-muted">選項來自「品項標籤」設定。</p>
            {tagGroups.length === 0 ? (
              <p className="text-[13px] lg:text-[14px] text-muted">還沒有標籤群組，先到「品項標籤」頁建立。</p>
            ) : (
              <div className="space-y-3 rounded-lg border border-line p-3">
                {tagGroups.map((g) => (
                  <div key={g.id}>
                    <p className="mb-1.5 text-xs font-medium text-muted">
                      {g.name}
                      {!g.multi && <span className="ml-1 opacity-70">· 單選</span>}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {g.options.map((opt) => (
                        <label
                          key={opt}
                          className="inline-flex cursor-pointer items-center rounded-lg border border-line px-2.5 py-1 text-sm has-[:checked]:border-brand has-[:checked]:bg-brand-soft has-[:checked]:text-ink"
                        >
                          <input
                            type={g.multi ? "checkbox" : "radio"}
                            name={g.multi ? "tags" : `tags-radio-${g.id}`}
                            value={opt}
                            defaultChecked={item?.tags.includes(opt) ?? false}
                            className="sr-only"
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {state.error && <p className="text-[13px] lg:text-[14px] text-danger">{state.error}</p>}
        </CardBody>
      </Card>

      <div className="mt-4 flex justify-end gap-2">
        <ButtonLink href="/admin/items" variant="ghost">
          {isEdit ? "返回列表" : "取消"}
        </ButtonLink>
        <Button disabled={pending || imageUploading}>
          {pending ? "儲存中…" : imageUploading ? "圖片上傳中…" : isEdit ? "儲存" : "建立品項"}
        </Button>
      </div>
    </form>
  );
}
