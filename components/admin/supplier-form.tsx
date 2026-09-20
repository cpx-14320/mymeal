"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, Field, inputClass, Button, ButtonLink } from "@/components/ui/primitives";
import type { SupplierView } from "@/lib/models/supplier";
import type { TemplateListItem } from "@/lib/models/template";
import { createSupplierAction, type CreateSupplierState } from "@/app/(app)/admin/pages/new/actions";
import {
  updateSupplierAction,
  deleteSupplierAction,
  type UpdateSupplierState,
} from "@/app/(app)/admin/pages/[id]/actions";

/** 新增 / 編輯店家共用的表單。傳 supplier 就是編輯模式（欄位帶入現值＋多一個刪除按鈕）。 */
export function SupplierForm({ supplier, templates }: { supplier?: SupplierView; templates: TemplateListItem[] }) {
  const router = useRouter();
  const isEdit = !!supplier;
  const action = isEdit ? updateSupplierAction.bind(null, supplier.id) : createSupplierAction;
  const [state, formAction, pending] = useActionState<CreateSupplierState | UpdateSupplierState, FormData>(
    action,
    {},
  );
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | undefined>();

  useEffect(() => {
    if (isEdit && state.success) router.refresh();
  }, [isEdit, state.success, router]);

  async function handleDelete() {
    if (!supplier) return;
    setDeleting(true);
    setDeleteError(undefined);
    const result = await deleteSupplierAction(supplier.id);
    if (result.error) {
      setDeleteError(result.error);
      setDeleting(false);
      return;
    }
    router.push("/admin/pages");
    router.refresh();
  }

  return (
    <form action={formAction}>
      <Card>
        <CardBody className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="店家名稱">
              <input className={inputClass} name="name" defaultValue={supplier?.name} required />
            </Field>

            <Field label="網址代稱 slug">
              <input
                className={inputClass}
                name="slug"
                defaultValue={supplier?.slug}
                placeholder="小寫英文、數字、-，例如 starbucks-sanduo"
                required
              />
            </Field>

            <Field label="說明文字">
              <input
                className={inputClass}
                name="description"
                defaultValue={supplier?.description}
                placeholder="便當、飲料、咖啡"
              />
            </Field>

            <Field label="圖示 emoji">
              <input
                className={inputClass}
                name="icon"
                maxLength={4}
                defaultValue={supplier?.icon}
                placeholder="🍱"
              />
            </Field>

            <Field label="圖示 SVG" hint="貼完整 <svg>...</svg> 標記；有填的話優先顯示，蓋過上面的 emoji。">
              <textarea
                className={`${inputClass} min-h-20 font-mono text-xs`}
                name="iconSvg"
                defaultValue={supplier?.iconSvg}
                placeholder='<svg viewBox="0 0 24 24">...</svg>'
              />
            </Field>

            <Field label="排序">
              <input
                className={inputClass}
                type="number"
                name="sortOrder"
                min={0}
                defaultValue={supplier?.sortOrder ?? 1}
                placeholder="數字越小越前面"
              />
            </Field>

            <div>
              <span className="mb-1.5 block text-sm font-medium">本頁開啟</span>
              <div className="flex h-10 items-center gap-4 text-sm">
                <label className="flex items-center gap-1.5">
                  <input
                    type="radio"
                    name="openInNewTab"
                    value="off"
                    defaultChecked={!supplier?.openInNewTab}
                  />
                  是
                </label>
                <label className="flex items-center gap-1.5">
                  <input
                    type="radio"
                    name="openInNewTab"
                    value="on"
                    defaultChecked={supplier?.openInNewTab ?? false}
                  />
                  否
                </label>
              </div>
            </div>
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-medium">熱門品項區塊</span>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="showTopItems"
                defaultChecked={supplier?.showTopItems ?? true}
              />
              在這個店家頁上方顯示「熱門品項」輪播
            </label>
          </div>

          <Field label="套用模板" hint="指定的話這個頁面改顯示模板內容（依分類分組），取代店家自己的品項；不套用就維持原本顯示店家品項。">
            <select
              key={supplier?.templateId ?? "none"}
              className={inputClass}
              name="templateId"
              defaultValue={supplier?.templateId ?? ""}
            >
              <option value="">不套用（顯示店家自己的品項）</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}（{t.sections.length} 分類）
                </option>
              ))}
            </select>
          </Field>

          {state.error && <p className="text-sm text-danger">{state.error}</p>}
        </CardBody>
      </Card>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        {isEdit ? (
          <div className="flex items-center gap-3">
            <Button type="button" variant="danger" disabled={deleting} onClick={handleDelete}>
              {deleting ? "刪除中…" : "刪除店家"}
            </Button>
            {deleteError && <p className="text-sm text-danger">{deleteError}</p>}
          </div>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <ButtonLink href="/admin/pages" variant="ghost">
            {isEdit ? "返回列表" : "取消"}
          </ButtonLink>
          <Button disabled={pending}>{pending ? "儲存中…" : isEdit ? "儲存" : "建立店家"}</Button>
        </div>
      </div>
    </form>
  );
}
