"use client";

import { useActionState, useState } from "react";
import { Card, CardBody, Field, inputClass, Button } from "@/components/ui/primitives";
import type { TemplateListItem } from "@/lib/models/template";
import { saveHomePreviewTemplateAction, type SaveHomePreviewState } from "@/app/(app)/admin/promos/home-preview-actions";

const initialState: SaveHomePreviewState = {};

/** 只有兩個欄位的設定表單：選模板、再選（可留空）該模板底下的區塊，存進 SiteSettings
 *  （見 lib/models/site-settings.ts）。區塊選單跟著目前選的模板即時換選項——換了模板但
 *  舊區塊不屬於新模板時，區塊選單自動退回「不指定」，不會送出一個對不上的區塊 id。
 *  存檔後導回廣宣版位頁帶 ?saved=1&tab=homePreview，由外層 MarketingTabs 統一跳成功訊息、
 *  切回這個分頁。 */
export function HomePreviewForm({
  templates,
  currentTemplateId,
  currentSectionId,
}: {
  templates: TemplateListItem[];
  currentTemplateId?: string;
  currentSectionId?: string;
}) {
  const [state, formAction, pending] = useActionState(saveHomePreviewTemplateAction, initialState);
  const [templateId, setTemplateId] = useState(currentTemplateId ?? "");
  const [sectionId, setSectionId] = useState(currentSectionId ?? "");

  const sections = templates.find((t) => t.id === templateId)?.sections ?? [];

  function onTemplateChange(next: string) {
    setTemplateId(next);
    // 換模板時，舊區塊如果不屬於新模板就清掉，避免看起來還選著、實際上對不到任何區塊。
    const stillValid = templates.find((t) => t.id === next)?.sections.some((s) => s.id === sectionId);
    if (!stillValid) setSectionId("");
  }

  return (
    <>
      <form action={formAction}>
        <Card>
          <CardBody className="space-y-5">
            <Field label="要顯示的模板" hint="不指定（留空）就維持首頁內建的範例假資料。">
              <select
                className={inputClass}
                name="templateId"
                value={templateId}
                onChange={(e) => onTemplateChange(e.target.value)}
              >
                <option value="">不指定（顯示範例假資料）</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}（{t.sections.reduce((n, s) => n + s.itemCount, 0)} 項品項）
                  </option>
                ))}
              </select>
            </Field>

            {templateId && (
              <Field label="只顯示其中一個區塊" hint="不指定就混合這個模板全部區塊的品項。">
                <select
                  className={inputClass}
                  name="sectionId"
                  value={sectionId}
                  onChange={(e) => setSectionId(e.target.value)}
                >
                  <option value="">不指定（混合全部區塊）</option>
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}（{s.itemCount} 項品項）
                    </option>
                  ))}
                </select>
              </Field>
            )}

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
