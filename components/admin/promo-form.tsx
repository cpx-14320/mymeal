"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, Field, inputClass, Note, Button, ButtonLink } from "@/components/ui/primitives";
import { ImageField } from "@/components/admin/image-field";
import { PROMO_PAGE_OPTIONS } from "@/lib/promo-pages";
import type { InterstitialView } from "@/lib/models/interstitial";
import { createPromoAction, type CreatePromoState } from "@/app/(app)/admin/promos/new/actions";
import { updatePromoAction, type UpdatePromoState } from "@/app/(app)/admin/promos/[id]/actions";

/** 新增 / 編輯蓋台廣告共用的表單。傳 promo 就是編輯模式（欄位帶入現值）。 */
export function PromoForm({ promo }: { promo?: InterstitialView }) {
  const router = useRouter();
  const isEdit = !!promo;
  const action = isEdit ? updatePromoAction.bind(null, promo.id) : createPromoAction;
  const [state, formAction, pending] = useActionState<CreatePromoState | UpdatePromoState, FormData>(
    action,
    {},
  );

  useEffect(() => {
    if (isEdit && state.success) router.refresh();
  }, [isEdit, state.success, router]);

  return (
    <form action={formAction}>
      <Card>
        <CardBody className="space-y-5">
          <Field label="活動名稱" hint="只在後台顯示，方便辨識">
            <input
              className={inputClass}
              name="name"
              defaultValue={promo?.name}
              placeholder="例：下午茶專區上線"
              required
            />
          </Field>

          <div>
            <span className="mb-1.5 block text-sm font-medium">廣告圖片</span>
            <ImageField label="廣告圖片" defaultPath={promo?.imageUrl} fallbackEmoji="🖼️" />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="點擊前往（連結網址）" hint="留空＝圖片不可點">
              <input
                className={inputClass}
                name="linkUrl"
                defaultValue={promo?.linkUrl}
                placeholder="/menu 或 https://…"
              />
            </Field>

            <Field label="倒數秒數" hint="0＝不自動關閉，需手動關">
              <input
                className={inputClass}
                type="number"
                name="dismissSeconds"
                min={0}
                max={60}
                defaultValue={promo?.dismissSeconds ?? 8}
              />
            </Field>

            <Field label="顯示頻率">
              <select className={inputClass} name="frequency" defaultValue={promo?.frequency ?? "daily"}>
                <option value="always">每次進站都顯示</option>
                <option value="daily">每人每天顯示一次</option>
                <option value="once">每人只顯示一次</option>
              </select>
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="排程開始">
              <input className={inputClass} type="datetime-local" name="startAt" defaultValue={promo?.startAt} required />
            </Field>
            <Field label="排程結束">
              <input className={inputClass} type="datetime-local" name="endAt" defaultValue={promo?.endAt} required />
            </Field>
          </div>

          <div>
            <span className="mb-1 block text-sm font-medium">顯示版位</span>
            <p className="mb-2 text-[13px] lg:text-[14px] text-muted">選擇這則廣告要在前台哪些頁面顯示，可複選；不勾就不會顯示在任何地方。</p>
            <div className="flex flex-wrap gap-2">
              {PROMO_PAGE_OPTIONS.map((opt) => (
                <label
                  key={opt.key}
                  className="inline-flex cursor-pointer items-center rounded-lg border border-line px-2.5 py-1 text-sm has-[:checked]:border-brand has-[:checked]:bg-brand-soft has-[:checked]:text-ink"
                >
                  <input
                    type="checkbox"
                    name="showOnPages"
                    value={opt.key}
                    defaultChecked={promo?.showOnPages.includes(opt.key) ?? opt.key === "group-orders"}
                    className="sr-only"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-medium">狀態</span>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="enabled" defaultChecked={promo?.enabled ?? true} />
              開啟（在排程時間內顯示於前台）
            </label>
          </div>

          <Note>排程結束後自動不顯示；也可把「開啟」關掉立即下架。時間依使用者本機時間判斷。</Note>

          {state.error && <p className="text-[13px] lg:text-[14px] text-danger">{state.error}</p>}
        </CardBody>
      </Card>

      <div className="mt-4 flex justify-end gap-2">
        <ButtonLink href="/admin/promos" variant="ghost">
          {isEdit ? "返回列表" : "取消"}
        </ButtonLink>
        <Button disabled={pending}>{pending ? "儲存中…" : isEdit ? "儲存" : "建立廣告"}</Button>
      </div>
    </form>
  );
}
