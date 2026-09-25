"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, Field, Badge, inputClass, Button, ButtonLink } from "@/components/ui/primitives";
import type { OrderZoneView } from "@/lib/models/order-zone";
import type { TemplateListItem } from "@/lib/models/template";
import { createZoneAction, type CreateZoneState } from "@/app/(app)/admin/zones/new/actions";
import { updateZoneAction, type UpdateZoneState } from "@/app/(app)/admin/zones/[id]/actions";

/** 新增 / 編輯訂餐專區共用的表單。傳 zone 就是編輯模式（欄位帶入現值）。 */
export function ZoneForm({ zone, templates }: { zone?: OrderZoneView; templates: TemplateListItem[] }) {
  const router = useRouter();
  const isEdit = !!zone;
  const action = isEdit ? updateZoneAction.bind(null, zone.id) : createZoneAction;
  const [state, formAction, pending] = useActionState<CreateZoneState | UpdateZoneState, FormData>(
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
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="專區名稱">
              <input className={inputClass} name="name" defaultValue={zone?.name} placeholder="例：下午茶" required />
            </Field>
            <Field label="代稱 slug" hint="前台網址：/z/{slug}">
              <input className={inputClass} name="slug" defaultValue={zone?.slug} placeholder="afternoon-tea" required />
            </Field>
          </div>

          <Field label="說明">
            <textarea
              className={`${inputClass} min-h-20`}
              name="description"
              defaultValue={zone?.description}
              placeholder="顯示在專區頁上方"
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="圖示 emoji">
              <input className={inputClass} name="icon" maxLength={4} defaultValue={zone?.icon} placeholder="🧋" />
            </Field>
            <Field label="排序" hint="數字小的排前面">
              <input className={inputClass} type="number" name="sortOrder" min={1} defaultValue={zone?.sortOrder ?? 1} />
            </Field>
          </div>

          <div>
            <span className="mb-1 block text-sm font-medium">套用的模板</span>
            <p className="mb-2 text-[13px] lg:text-[14px] text-muted">可勾選多個；同一個模板也能被其他專區共用。</p>
            {templates.length === 0 ? (
              <p className="text-[13px] lg:text-[14px] text-muted">還沒有模板，先到「模板」頁建立。</p>
            ) : (
              <div className="space-y-2.5 rounded-lg border border-line p-3">
                {templates.map((t) => {
                  const itemCount = t.sections.reduce((n, s) => n + s.itemCount, 0);
                  return (
                    <label key={t.id} className="flex flex-wrap items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        name="templateIds"
                        value={t.id}
                        defaultChecked={zone?.templateIds.includes(t.id) ?? false}
                      />
                      <span className="font-medium">{t.name}</span>
                      <Badge>{t.categoryName}</Badge>
                      <span className="text-[13px] lg:text-[14px] text-muted">
                        {t.sections.length} 分類．{itemCount} 品項
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-medium">狀態</span>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="active" defaultChecked={zone?.active ?? true} />
              上架（前台可見、可開團）
            </label>
          </div>

          {state.error && <p className="text-[13px] lg:text-[14px] text-danger">{state.error}</p>}
        </CardBody>
      </Card>

      <div className="mt-4 flex justify-end gap-2">
        <ButtonLink href="/admin/zones" variant="ghost">
          {isEdit ? "返回列表" : "取消"}
        </ButtonLink>
        <Button disabled={pending}>{pending ? "儲存中…" : isEdit ? "儲存" : "建立專區"}</Button>
      </div>
    </form>
  );
}
