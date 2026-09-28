"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Section, Button, Card, CardBody, Field, inputClass, ItemLabel } from "@/components/ui/primitives";
import type { TemplateDetail } from "@/lib/models/template";
import type { CatalogItemView } from "@/lib/models/catalog-item";
import {
  updateTemplateBasicAction,
  addTemplateSectionAction,
  renameTemplateSectionAction,
  deleteTemplateSectionAction,
  addItemToSectionAction,
  removeItemFromSectionAction,
  type TemplateBasicState,
} from "@/app/(app)/admin/templates/[id]/actions";
import { CreatedBanner } from "@/components/admin/created-banner";

const initialBasicState: TemplateBasicState = {};

export function TemplateEditor({
  template,
  items,
}: {
  template: TemplateDetail;
  items: CatalogItemView[];
}) {
  const router = useRouter();
  const [addingSection, setAddingSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const [pickerSectionId, setPickerSectionId] = useState<string | null>(null);
  const [renamingSectionId, setRenamingSectionId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const boundBasicAction = updateTemplateBasicAction.bind(null, template.id);
  const [basicState, basicFormAction, basicPending] = useActionState(boundBasicAction, initialBasicState);
  const [lastBasicState, setLastBasicState] = useState(basicState);

  if (basicState !== lastBasicState) {
    setLastBasicState(basicState);
    if (basicState.success) router.refresh();
  }

  async function submitNewSection() {
    const name = newSectionName.trim();
    if (!name) return;
    await addTemplateSectionAction(template.id, name);
    setNewSectionName("");
    setAddingSection(false);
    router.refresh();
  }

  function startRename(sectionId: string, current: string) {
    setRenamingSectionId(sectionId);
    setRenameValue(current);
  }

  async function commitRename() {
    if (!renamingSectionId) return;
    await renameTemplateSectionAction(template.id, renamingSectionId, renameValue);
    setRenamingSectionId(null);
    router.refresh();
  }

  async function deleteSection(sectionId: string) {
    await deleteTemplateSectionAction(template.id, sectionId);
    router.refresh();
  }

  async function removeItem(sectionId: string, itemId: string) {
    await removeItemFromSectionAction(template.id, sectionId, itemId);
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <CreatedBanner message="模板已建立成功，可以繼續編輯以下內容。" />

      <Section title="基本資料">
        <form action={basicFormAction} className="flex flex-wrap items-end gap-3">
          <div className="min-w-0 flex-1">
            <Field label="模板名稱">
              <input className={inputClass} name="name" defaultValue={template.name} required />
            </Field>
          </div>
          <Button disabled={basicPending}>{basicPending ? "儲存中…" : "儲存"}</Button>
        </form>
        {basicState.error && <p className="text-[13px] lg:text-[14px] text-danger">{basicState.error}</p>}
      </Section>

      <Section
        title="區塊"
        actions={
          addingSection ? null : <Button onClick={() => setAddingSection(true)}>＋ 新增區塊</Button>
        }
      >
        {addingSection && (
          <div className="flex max-w-md items-center gap-2">
            <input
              className={`${inputClass} min-w-0`}
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              placeholder="區塊名稱，例：星期一"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submitNewSection();
                }
              }}
            />
            <Button className="shrink-0" onClick={submitNewSection}>
              新增
            </Button>
            <Button className="shrink-0" variant="ghost" onClick={() => setAddingSection(false)}>
              取消
            </Button>
          </div>
        )}
      </Section>

      <div className="space-y-4">
        {template.sections.map((sec) => (
          <Card key={sec.id}>
            <CardBody className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                {renamingSectionId === sec.id ? (
                  <div className="flex flex-1 items-center gap-2">
                    <input
                      className={`${inputClass} max-w-xs`}
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      autoFocus
                    />
                    <button type="button" onClick={commitRename} className="text-xs font-medium text-brand hover:underline">
                      儲存
                    </button>
                    <button
                      type="button"
                      onClick={() => setRenamingSectionId(null)}
                      className="text-xs font-medium text-muted hover:underline"
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{sec.name}</span>
                    <span className="text-[13px] lg:text-[14px] text-muted tabular-nums">{sec.items.length} 個品項</span>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => startRename(sec.id, sec.name)}>
                    改名
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => deleteSection(sec.id)}>
                    刪除區塊
                  </Button>
                </div>
              </div>

              <ul className="divide-y divide-line rounded-lg border border-line">
                {sec.items.length === 0 && <li className="px-3 py-2.5 text-[13px] lg:text-[14px] text-muted">還沒有品項。</li>}
                {sec.items.map((it) => (
                  <li key={it.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                    <ItemLabel imageUrl={it.imageUrl} emoji={it.emoji} name={it.name} />
                    <span className="flex items-center gap-3">
                      <span className="text-[13px] lg:text-[14px] tabular-nums text-muted">NT$ {it.price}</span>
                      <button
                        type="button"
                        onClick={() => removeItem(sec.id, it.id)}
                        className="text-muted hover:text-danger"
                      >
                        移除
                      </button>
                    </span>
                  </li>
                ))}
              </ul>

              {pickerSectionId === sec.id ? (
                <ItemPicker
                  templateId={template.id}
                  sectionId={sec.id}
                  existingItemIds={new Set(sec.items.map((it) => it.id))}
                  items={items}
                  onClose={() => setPickerSectionId(null)}
                  onChanged={() => router.refresh()}
                />
              ) : (
                <Button variant="secondary" size="sm" onClick={() => setPickerSectionId(sec.id)}>
                  ＋ 從品項加入
                </Button>
              )}
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ItemPicker({
  sectionId,
  templateId,
  existingItemIds,
  items,
  onClose,
  onChanged,
}: {
  templateId: string;
  sectionId: string;
  existingItemIds: Set<string>;
  items: CatalogItemView[];
  onClose: () => void;
  onChanged: () => void;
}) {
  const [query, setQuery] = useState("");
  const [added, setAdded] = useState(existingItemIds);
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = items.filter((it) => it.name.toLowerCase().includes(query.trim().toLowerCase()));

  async function toggle(item: CatalogItemView) {
    setBusyId(item.id);
    if (added.has(item.id)) {
      await removeItemFromSectionAction(templateId, sectionId, item.id);
      setAdded((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    } else {
      await addItemToSectionAction(templateId, sectionId, item.id);
      setAdded((prev) => new Set(prev).add(item.id));
    }
    setBusyId(null);
    onChanged();
  }

  return (
    <div className="space-y-3 rounded-lg border border-line bg-surface-2 p-3">
      <div className="flex items-center gap-2">
        <input
          className={inputClass}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜尋品項名稱…"
          autoFocus
        />
        <button type="button" onClick={onClose} className="whitespace-nowrap text-xs font-medium text-muted hover:underline">
          完成
        </button>
      </div>
      <ul className="max-h-72 divide-y divide-line overflow-y-auto rounded-lg border border-line bg-surface">
        {filtered.length === 0 && <li className="px-3 py-2.5 text-[13px] lg:text-[14px] text-muted">沒有符合的品項。</li>}
        {filtered.map((it) => (
          <li key={it.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
            <span className="flex items-center gap-2">
              <ItemLabel imageUrl={it.imageUrl} emoji={it.emoji} name={it.name} />
              <span className="text-[13px] lg:text-[14px] text-muted">NT$ {it.price}</span>
            </span>
            <Button
              variant={added.has(it.id) ? "secondary" : "primary"}
              size="sm"
              disabled={busyId === it.id}
              onClick={() => toggle(it)}
            >
              {added.has(it.id) ? "已加入" : "加入"}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
