"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, Field, inputClass, Button, ButtonLink } from "@/components/ui/primitives";
import { ImageField } from "@/components/admin/image-field";
import type { CatalogItemView } from "@/lib/models/catalog-item";
import type { ItemKindOption } from "@/lib/models/item-kind";
import type { ItemCategoryOption } from "@/lib/models/item-category";
import type { SupplierView } from "@/lib/models/supplier";
import type { TagGroupView } from "@/lib/models/tag-group";
import { createItemAction, type CreateItemState } from "@/app/(app)/admin/items/new/actions";
import { updateItemAction, deleteItemAction, type UpdateItemState } from "@/app/(app)/admin/items/[id]/actions";

/** 新增 / 編輯品項共用的表單。傳 item 就是編輯模式（欄位帶入現值＋多一個刪除按鈕）。 */
export function ItemForm({
  item,
  kinds,
  categories,
  suppliers,
  tagGroups,
}: {
  item?: CatalogItemView;
  kinds: ItemKindOption[];
  categories: ItemCategoryOption[];
  suppliers: SupplierView[];
  tagGroups: TagGroupView[];
}) {
  const router = useRouter();
  const isEdit = !!item;
  const action = isEdit ? updateItemAction.bind(null, item.id) : createItemAction;
  const [state, formAction, pending] = useActionState<CreateItemState | UpdateItemState, FormData>(
    action,
    {},
  );
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | undefined>();

  useEffect(() => {
    if (isEdit && state.success) router.refresh();
  }, [isEdit, state.success, router]);

  async function handleDelete() {
    if (!item) return;
    setDeleting(true);
    setDeleteError(undefined);
    const result = await deleteItemAction(item.id);
    if (result.error) {
      setDeleteError(result.error);
      setDeleting(false);
      return;
    }
    router.push("/admin/items");
    router.refresh();
  }

  return (
    <form action={formAction}>
      <Card>
        <CardBody className="space-y-5">
          <ImageField defaultPath={item?.imageUrl} fallbackEmoji={item?.emoji} />

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="品項名稱">
              <input className={inputClass} name="name" defaultValue={item?.name} placeholder="例：招牌雞腿飯" required />
            </Field>

            <Field label="備用圖示 emoji" hint="沒有圖片時，清單縮圖顯示這個">
              <input className={inputClass} name="emoji" maxLength={4} defaultValue={item?.emoji} placeholder="🍗" />
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="頁面">
              <select className={inputClass} name="supplierId" defaultValue={item?.supplierId ?? ""}>
                <option value="">選擇頁面</option>
                {suppliers.map((s) => (
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

            <Field label="類型">
              <select className={inputClass} name="kindId" defaultValue={item?.kindId ?? ""} required>
                <option value="" disabled>
                  選擇類型
                </option>
                {kinds.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.name}
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
          </div>

          <div>
            <span className="mb-1 block text-sm font-medium">標籤</span>
            <p className="mb-2 text-xs text-muted">選項來自「標籤群組」設定（在後台「品項標籤」頁管理）。</p>
            {tagGroups.length === 0 ? (
              <p className="text-sm text-muted">還沒有標籤群組，先到「品項標籤」頁建立。</p>
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

          <div>
            <span className="mb-1.5 block text-sm font-medium">狀態</span>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="active" defaultChecked={item?.active ?? true} />
              啟用（可被模板選用）
            </label>
          </div>

          {state.error && <p className="text-sm text-danger">{state.error}</p>}
        </CardBody>
      </Card>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        {isEdit ? (
          <div className="flex items-center gap-3">
            <Button type="button" variant="danger" disabled={deleting} onClick={handleDelete}>
              {deleting ? "刪除中…" : "刪除品項"}
            </Button>
            {deleteError && <p className="text-sm text-danger">{deleteError}</p>}
          </div>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <ButtonLink href="/admin/items" variant="ghost">
            {isEdit ? "返回列表" : "取消"}
          </ButtonLink>
          <Button disabled={pending}>{pending ? "儲存中…" : isEdit ? "儲存" : "建立品項"}</Button>
        </div>
      </div>
    </form>
  );
}
