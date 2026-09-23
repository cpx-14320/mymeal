"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, Field, inputClass, Note, Button, ButtonLink } from "@/components/ui/primitives";
import { ImageField } from "@/components/admin/image-field";
import type { InterstitialView } from "@/lib/models/interstitial";
import { createPromoAction, type CreatePromoState } from "@/app/(app)/admin/promos/new/actions";
import { updatePromoAction, deletePromoAction, type UpdatePromoState } from "@/app/(app)/admin/promos/[id]/actions";

/** 新增 / 編輯蓋台廣告共用的表單。傳 promo 就是編輯模式（欄位帶入現值＋多一個刪除按鈕）。 */
export function PromoForm({ promo }: { promo?: InterstitialView }) {
  const router = useRouter();
  const isEdit = !!promo;
  const action = isEdit ? updatePromoAction.bind(null, promo.id) : createPromoAction;
  const [state, formAction, pending] = useActionState<CreatePromoState | UpdatePromoState, FormData>(
    action,
    {},
  );
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | undefined>();

  useEffect(() => {
    if (isEdit && state.success) router.refresh();
  }, [isEdit, state.success, router]);

  async function handleDelete() {
    if (!promo) return;
    setDeleting(true);
    setDeleteError(undefined);
    const result = await deletePromoAction(promo.id);
    if (result.error) {
      setDeleteError(result.error);
      setDeleting(false);
      return;
    }
    router.push("/admin/promos");
    router.refresh();
  }

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

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        {isEdit ? (
          <div className="flex items-center gap-3">
            <Button type="button" variant="danger" disabled={deleting} onClick={handleDelete}>
              {deleting ? "刪除中…" : "刪除廣告"}
            </Button>
            {deleteError && <p className="text-[13px] lg:text-[14px] text-danger">{deleteError}</p>}
          </div>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <ButtonLink href="/admin/promos" variant="ghost">
            {isEdit ? "返回列表" : "取消"}
          </ButtonLink>
          <Button disabled={pending}>{pending ? "儲存中…" : isEdit ? "儲存" : "建立廣告"}</Button>
        </div>
      </div>
    </form>
  );
}
