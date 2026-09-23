"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, Field, inputClass, Button, ButtonLink } from "@/components/ui/primitives";
import type { PageView } from "@/lib/models/page";
import type { TemplateListItem } from "@/lib/models/template";
import { createPageAction, type CreatePageState } from "@/app/(app)/admin/pages/new/actions";
import {
  updatePageAction,
  deletePageAction,
  type UpdatePageState,
} from "@/app/(app)/admin/pages/[id]/actions";

/** 圖示 SVG 挑選預設──沒接觸過這個欄位的管理員常常不知道去哪裡找 SVG 貼；
 *  給幾個跟餐飲頁面情境相關的現成圖示可以直接點選，樣式跟側欄導覽圖示（icons.tsx）同一套
 *  （24x24、stroke=currentColor），顏色會自動跟著前台連結的文字顏色走。點了會直接填進下面的
 *  textarea，欄位本身還是可以手動改成任何自訂 SVG。 */
const ICON_SVG_PRESETS: { label: string; svg: string }[] = [
  {
    label: "便當",
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="12" rx="2"/><path d="M3 8V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2"/><path d="M12 8v12"/></svg>',
  },
  {
    label: "飲料",
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8h12l-1.2 12.2a2 2 0 0 1-2 1.8H9.2a2 2 0 0 1-2-1.8Z"/><path d="M5 8l1-3h12l1 3"/><path d="M9 12h6"/></svg>',
  },
  {
    label: "咖啡",
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5Z"/><path d="M17 9h1.5a2.5 2.5 0 0 1 0 5H17"/><path d="M7 4c0 .9-1 .9-1 1.8M11 4c0 .9-1 .9-1 1.8"/></svg>',
  },
  {
    label: "甜點",
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 21l1.5-9h13L20 21Z"/><path d="M6.5 12a5.5 5.5 0 0 1 11 0"/><path d="M12 6.5V3"/></svg>',
  },
  {
    label: "麵食",
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11h18l-1.5 9h-15Z"/><path d="M3 11a9 9 0 0 1 18 0"/><path d="M9 15v3M12 15v3M15 15v3"/></svg>',
  },
  {
    label: "漢堡",
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10c0-3 3.6-6 8-6s8 3 8 6Z"/><path d="M3 13h18"/><path d="M4 16h16l-1 3a2 2 0 0 1-2 1.5H7A2 2 0 0 1 5 19Z"/></svg>',
  },
  {
    label: "披薩",
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 3 19h18Z"/><path d="M12 3v16M7.5 11h9"/><circle cx="10" cy="15" r=".8" fill="currentColor" stroke="none"/><circle cx="14.3" cy="15" r=".8" fill="currentColor" stroke="none"/></svg>',
  },
  {
    label: "壽司",
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="10" width="18" height="8" rx="3"/><path d="M3 14h18"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>',
  },
  {
    label: "頁面",
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h16v11H4z"/><path d="M4 9l1.6-4.5A2 2 0 0 1 7.5 3h9a2 2 0 0 1 1.9 1.5L20 9"/><path d="M9 20v-5h6v5"/></svg>',
  },
  {
    label: "標籤",
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12.6 3H5a2 2 0 0 0-2 2v7.6a2 2 0 0 0 .6 1.4l8.4 8.4a2 2 0 0 0 2.8 0l6.2-6.2a2 2 0 0 0 0-2.8L13 3.6a2 2 0 0 0-1.4-.6Z"/><circle cx="8" cy="8" r="1.2" fill="currentColor" stroke="none"/></svg>',
  },
];

/** 新增 / 編輯頁面共用的表單。傳 page 就是編輯模式（欄位帶入現值＋多一個刪除按鈕）。 */
export function PageForm({ page, templates }: { page?: PageView; templates: TemplateListItem[] }) {
  const router = useRouter();
  const isEdit = !!page;
  const action = isEdit ? updatePageAction.bind(null, page.id) : createPageAction;
  const [state, formAction, pending] = useActionState<CreatePageState | UpdatePageState, FormData>(
    action,
    {},
  );
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | undefined>();
  const [iconSvgValue, setIconSvgValue] = useState(page?.iconSvg ?? "");

  useEffect(() => {
    if (isEdit && state.success) router.refresh();
  }, [isEdit, state.success, router]);

  async function handleDelete() {
    if (!page) return;
    setDeleting(true);
    setDeleteError(undefined);
    const result = await deletePageAction(page.id);
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
            <Field label="頁面名稱">
              <input className={inputClass} name="name" defaultValue={page?.name} required />
            </Field>

            <Field label="網址代稱 slug">
              <input
                className={inputClass}
                name="slug"
                defaultValue={page?.slug}
                placeholder="小寫英文、數字、-，例如 starbucks-sanduo"
                required
              />
            </Field>

            <Field label="說明文字">
              <input
                className={inputClass}
                name="description"
                defaultValue={page?.description}
                placeholder="便當、飲料、咖啡"
              />
            </Field>

            <Field label="圖示 emoji">
              <input
                className={inputClass}
                name="icon"
                maxLength={4}
                defaultValue={page?.icon}
                placeholder="🍱"
              />
            </Field>

            <Field label="排序">
              <input
                className={inputClass}
                type="number"
                name="sortOrder"
                min={0}
                defaultValue={page?.sortOrder ?? 1}
                placeholder="數字越小越前面"
              />
            </Field>

            <Field label="套用模板" hint="指定的話這個頁面改顯示模板內容（依分類分組），取代頁面自己標註的品項；不套用就維持原本顯示頁面標註的品項。">
              <select
                key={page?.templateId ?? "none"}
                className={inputClass}
                name="templateId"
                defaultValue={page?.templateId ?? ""}
              >
                <option value="">不套用（顯示頁面自己標註的品項）</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}（{t.sections.length} 分類）
                  </option>
                ))}
              </select>
            </Field>

            <div className="sm:col-span-2">
              <Field
                label="圖示 SVG"
                hint="點選下面的現成圖示，或貼上自訂的完整 <svg>...</svg> 標記；有填的話優先顯示，蓋過上面的 emoji。留空則使用預設圖示。"
              >
                <div className="mb-2 flex flex-wrap gap-2">
                  {ICON_SVG_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      title={preset.label}
                      aria-label={preset.label}
                      onClick={() => setIconSvgValue(preset.svg)}
                      className={`grid size-9 shrink-0 place-items-center rounded-lg border [&_svg]:h-5 [&_svg]:w-5 ${
                        iconSvgValue === preset.svg
                          ? "border-brand bg-brand-soft text-brand"
                          : "border-line text-ink hover:bg-surface-2"
                      }`}
                      dangerouslySetInnerHTML={{ __html: preset.svg }}
                    />
                  ))}
                  {iconSvgValue && (
                    <button
                      type="button"
                      onClick={() => setIconSvgValue("")}
                      className="self-center px-2 text-xs font-medium text-muted hover:text-danger"
                    >
                      清空
                    </button>
                  )}
                </div>
                <textarea
                  className={`${inputClass} min-h-20 font-mono text-xs`}
                  name="iconSvg"
                  value={iconSvgValue}
                  onChange={(e) => setIconSvgValue(e.target.value)}
                  placeholder='<svg viewBox="0 0 24 24">...</svg>'
                />
              </Field>
            </div>

            <div>
              <span className="mb-1.5 block text-sm font-medium">本頁開啟</span>
              <div className="flex h-10 items-center gap-4 text-sm">
                <label className="flex items-center gap-1.5">
                  <input
                    type="radio"
                    name="openInNewTab"
                    value="off"
                    defaultChecked={!page?.openInNewTab}
                  />
                  是
                </label>
                <label className="flex items-center gap-1.5">
                  <input
                    type="radio"
                    name="openInNewTab"
                    value="on"
                    defaultChecked={page?.openInNewTab ?? false}
                  />
                  否
                </label>
              </div>
            </div>

            <div>
              <span className="mb-1.5 block text-sm font-medium">熱門品項區塊</span>
              <div className="flex h-10 items-center gap-4 text-sm">
                <label className="flex items-center gap-1.5">
                  <input
                    type="radio"
                    name="showTopItems"
                    value="on"
                    defaultChecked={page?.showTopItems ?? true}
                  />
                  顯示
                </label>
                <label className="flex items-center gap-1.5">
                  <input
                    type="radio"
                    name="showTopItems"
                    value="off"
                    defaultChecked={!(page?.showTopItems ?? true)}
                  />
                  隱藏
                </label>
              </div>
            </div>
          </div>

          {state.error && <p className="text-[13px] lg:text-[14px] text-danger">{state.error}</p>}
        </CardBody>
      </Card>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        {isEdit ? (
          <div className="flex items-center gap-3">
            <Button type="button" variant="danger" disabled={deleting} onClick={handleDelete}>
              {deleting ? "刪除中…" : "刪除頁面"}
            </Button>
            {deleteError && <p className="text-[13px] lg:text-[14px] text-danger">{deleteError}</p>}
          </div>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <ButtonLink href="/admin/pages" variant="ghost">
            {isEdit ? "返回列表" : "取消"}
          </ButtonLink>
          <Button disabled={pending}>{pending ? "儲存中…" : isEdit ? "儲存" : "建立頁面"}</Button>
        </div>
      </div>
    </form>
  );
}
