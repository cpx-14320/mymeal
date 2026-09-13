import { Card, CardBody, Field, inputClass, Note } from "@/components/ui/primitives";
import { ImageField } from "@/components/admin/image-field";
import type { Interstitial } from "@/lib/mock";

/** 新增 / 編輯蓋台廣告共用的表單。傳 promo 就是編輯模式。 */
export function PromoForm({ promo }: { promo?: Interstitial }) {
  return (
    <Card>
      <CardBody className="space-y-5">
        <Field label="活動名稱" hint="只在後台顯示，方便辨識">
          <input
            className={inputClass}
            defaultValue={promo?.name}
            placeholder="例：下午茶專區上線"
          />
        </Field>

        <div>
          <span className="mb-1.5 block text-sm font-medium">廣告圖片</span>
          <ImageField defaultPath={promo?.imageUrl} fallbackEmoji="🖼️" />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="點擊前往（連結網址）" hint="留空＝圖片不可點">
            <input
              className={inputClass}
              defaultValue={promo?.linkUrl}
              placeholder="/menu 或 https://…"
            />
          </Field>

          <Field label="倒數秒數" hint="0＝不自動關閉，需手動關">
            <input
              className={inputClass}
              type="number"
              min={0}
              max={60}
              defaultValue={promo?.dismissSeconds ?? 8}
            />
          </Field>

          <Field label="顯示頻率">
            <select
              className={inputClass}
              defaultValue={promo?.frequency ?? "daily"}
            >
              <option value="always">每次進站都顯示</option>
              <option value="daily">每人每天顯示一次</option>
              <option value="once">每人只顯示一次</option>
            </select>
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="排程開始">
            <input
              className={inputClass}
              type="datetime-local"
              defaultValue={promo?.startAt}
            />
          </Field>
          <Field label="排程結束">
            <input
              className={inputClass}
              type="datetime-local"
              defaultValue={promo?.endAt}
            />
          </Field>
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-medium">狀態</span>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" defaultChecked={promo?.enabled ?? true} />
            開啟（在排程時間內顯示於前台）
          </label>
        </div>

        <Note>
          排程結束後自動不顯示；也可把「開啟」關掉立即下架。時間依使用者本機時間判斷。
        </Note>
      </CardBody>
    </Card>
  );
}
