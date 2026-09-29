"use client";

import { useActionState } from "react";
import { Card, CardBody, Field, inputClass, Button } from "@/components/ui/primitives";
import type { TemplateListItem } from "@/lib/models/template";
import { saveHomePreviewTemplateAction, type SaveHomePreviewState } from "@/app/(app)/admin/home-preview/actions";
import { CreatedBanner } from "@/components/admin/created-banner";

const initialState: SaveHomePreviewState = {};

/** 只有一個欄位的設定表單：選一個模板存進 SiteSettings（見 lib/models/site-settings.ts）。
 *  存檔後導回自己這頁帶 ?saved=1，用共用的 CreatedBanner 跳成功訊息，
 *  不用另外管一個「剛存檔成功」的 client state。 */
export function HomePreviewForm({
  templates,
  currentTemplateId,
}: {
  templates: TemplateListItem[];
  currentTemplateId?: string;
}) {
  const [state, formAction, pending] = useActionState(saveHomePreviewTemplateAction, initialState);

  return (
    <>
      <CreatedBanner param="saved" message="已儲存首頁菜單預覽設定。" />

      <form action={formAction}>
        <Card>
          <CardBody className="space-y-5">
            <Field label="要顯示的模板" hint="不指定（留空）就維持首頁內建的範例假資料。">
              <select className={inputClass} name="templateId" defaultValue={currentTemplateId ?? ""}>
                <option value="">不指定（顯示範例假資料）</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}（{t.sections.reduce((n, s) => n + s.itemCount, 0)} 項品項）
                  </option>
                ))}
              </select>
            </Field>

            {state.error && <p className="text-[13px] lg:text-[14px] text-danger">{state.error}</p>}
          </CardBody>
        </Card>

        <div className="mt-4 flex justify-end">
          <Button disabled={pending}>{pending ? "儲存中…" : "儲存"}</Button>
        </div>
      </form>
    </>
  );
}
