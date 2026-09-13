import { Card, CardBody, Field, inputClass } from "@/components/ui/primitives";
import { ImageField } from "@/components/admin/image-field";
import {
  suppliers,
  itemCategories,
  itemKindLabel,
  tagGroups,
  type CatalogItem,
  type ItemKind,
} from "@/lib/mock";

const kinds: ItemKind[] = ["meal", "drink", "snack", "other"];

/** 新增 / 編輯品項共用的表單。傳 item 就是編輯模式（欄位帶入現值）。 */
export function ItemForm({ item }: { item?: CatalogItem }) {
  return (
    <Card>
      <CardBody className="space-y-5">
        <Field label="品項名稱">
          <input
            className={inputClass}
            defaultValue={item?.name}
            placeholder="例：招牌雞腿飯"
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="類型">
            <select className={inputClass} defaultValue={item?.kind ?? "meal"}>
              {kinds.map((k) => (
                <option key={k} value={k}>
                  {itemKindLabel[k]}
                </option>
              ))}
            </select>
          </Field>

          <Field label="分類">
            <select className={inputClass} defaultValue={item?.category ?? ""}>
              <option value="" disabled>
                選擇分類
              </option>
              {itemCategories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>

          <Field label="店家">
            <select className={inputClass} defaultValue={item?.supplierId ?? ""}>
              <option value="" disabled>
                選擇店家
              </option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="預設價（NT$）">
            <input
              className={inputClass}
              type="number"
              min={0}
              step={5}
              defaultValue={item?.price}
              placeholder="95"
            />
          </Field>

          <Field label="備用圖示 emoji" hint="沒有圖片時，清單縮圖顯示這個">
            <input
              className={inputClass}
              maxLength={4}
              defaultValue={item?.emoji}
              placeholder="🍗"
            />
          </Field>
        </div>

        <div>
          <span className="mb-1 block text-sm font-medium">標籤</span>
          <p className="mb-2 text-xs text-muted">
            選項來自「標籤群組」設定（在後台「品項標籤」頁管理）。
          </p>
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
                        name={`tag-${g.id}`}
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
        </div>

        <ImageField
          defaultPath={item?.imageUrl}
          fallbackEmoji={item?.emoji}
        />

        <Field label="說明">
          <textarea
            className={`${inputClass} min-h-20`}
            defaultValue=""
            placeholder="選填，顯示在菜單卡片上"
          />
        </Field>

        <div>
          <span className="mb-1.5 block text-sm font-medium">狀態</span>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" defaultChecked={item?.active ?? true} />
            啟用（可被模板選用）
          </label>
        </div>
      </CardBody>
    </Card>
  );
}
