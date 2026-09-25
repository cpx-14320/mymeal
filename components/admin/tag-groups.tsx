"use client";

import { useEffect, useState, useTransition, type ComponentProps, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, Button, inputClass } from "@/components/ui/primitives";
import { Modal, ModalHeader } from "@/components/ui/modal";
import type { TagGroupView } from "@/lib/models/tag-group";
import {
  createTagGroupAction,
  renameTagGroupAction,
  toggleTagGroupMultiAction,
  addTagOptionAction,
  renameTagOptionAction,
  removeTagOptionAction,
  deleteTagGroupAction,
  reorderTagGroupsAction,
  reorderTagOptionsAction,
} from "@/app/(app)/admin/items/tags/actions";

/** 拖曳排序用的小把手，樣式跟 NameListCard 的「⠿」一致——群組卡片、選項列共用同一顆。 */
function DragHandle({ label, ...dragProps }: { label: string } & ComponentProps<"span">) {
  return (
    <span
      {...dragProps}
      draggable
      aria-label={label}
      className="shrink-0 cursor-grab select-none text-muted active:cursor-grabbing"
    >
      ⠿
    </span>
  );
}

/** 單一標籤群組卡片：名稱可就地改名（跟 NameListCard 同一種「修改→儲存/取消」互動），
 *  單複選切換、選項 chip 新增/移除，刪除前跳確認彈窗——跟「類型」「分類」卡片同一套視覺語言。
 *  dragHandle 由外層 TagGroupsManager 傳入（含 draggable/onDragStart 等），這裡只負責擺放位置。 */
function TagGroupCard({ group, dragHandle }: { group: TagGroupView; dragHandle?: ReactNode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [localGroup, setLocalGroup] = useState(group);
  const [editing, setEditing] = useState(false);
  const [nameValue, setNameValue] = useState(group.name);
  const [draft, setDraft] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editingOption, setEditingOption] = useState<string | null>(null);
  const [editOptionValue, setEditOptionValue] = useState("");
  const [dragOption, setDragOption] = useState<string | null>(null);
  const [optionError, setOptionError] = useState<string | undefined>();

  useEffect(() => {
    setLocalGroup(group);
  }, [group]);

  function handleOptionDrop(targetOption: string) {
    if (!dragOption || dragOption === targetOption) return;
    const options = localGroup.options;
    const from = options.indexOf(dragOption);
    const to = options.indexOf(targetOption);
    if (from === -1 || to === -1) return;

    const next = [...options];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setLocalGroup((g) => ({ ...g, options: next }));
    setDragOption(null);
    setOptionError(undefined);

    startTransition(async () => {
      const result = await reorderTagOptionsAction(group.id, next);
      if (result.error) {
        setOptionError(result.error);
        setLocalGroup((g) => ({ ...g, options }));
        return;
      }
      router.refresh();
    });
  }

  function startEdit() {
    setNameValue(localGroup.name);
    setEditing(true);
  }

  function commitName() {
    const value = nameValue.trim();
    setEditing(false);
    if (!value || value === localGroup.name) return;
    setLocalGroup((g) => ({ ...g, name: value }));
    startTransition(async () => {
      await renameTagGroupAction(group.id, value);
      router.refresh();
    });
  }

  function toggleMulti() {
    setLocalGroup((g) => ({ ...g, multi: !g.multi }));
    startTransition(async () => {
      await toggleTagGroupMultiAction(group.id, !localGroup.multi);
      router.refresh();
    });
  }

  function addOption() {
    const v = draft.trim();
    if (!v) return;
    setLocalGroup((g) => ({ ...g, options: [...g.options, v] }));
    startTransition(async () => {
      await addTagOptionAction(group.id, v);
      router.refresh();
    });
    setDraft("");
  }

  function removeOption(option: string) {
    setLocalGroup((g) => ({ ...g, options: g.options.filter((o) => o !== option) }));
    startTransition(async () => {
      await removeTagOptionAction(group.id, option);
      router.refresh();
    });
  }

  function startEditOption(option: string) {
    setEditingOption(option);
    setEditOptionValue(option);
  }

  function commitEditOption() {
    const value = editOptionValue.trim();
    const target = editingOption;
    setEditingOption(null);
    if (!target || !value || value === target) return;
    setLocalGroup((g) => ({ ...g, options: g.options.map((o) => (o === target ? value : o)) }));
    startTransition(async () => {
      await renameTagOptionAction(group.id, target, value);
      router.refresh();
    });
  }

  async function handleDelete() {
    setConfirming(false);
    setDeleting(true);
    await deleteTagGroupAction(group.id);
    router.refresh();
    setDeleting(false);
  }

  return (
    <Card>
      <CardBody className="space-y-4">
        <div className="flex items-center gap-2">
          {dragHandle}
          {editing ? (
            <>
              <input
                className={`${inputClass} flex-1`}
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                disabled={deleting}
                autoFocus
              />
              <button
                type="button"
                onClick={commitName}
                className="text-xs font-medium text-brand hover:underline"
              >
                儲存
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="text-xs font-medium text-muted hover:underline"
              >
                取消
              </button>
            </>
          ) : (
            <>
              <p className="flex-1 font-medium">{localGroup.name}</p>
              <button
                type="button"
                onClick={() => toggleMulti()}
                className="shrink-0 rounded-full border border-line px-2 py-0.5 text-[13px] text-muted hover:text-ink"
              >
                {localGroup.multi ? "可複選" : "單選"}
              </button>
              <button
                type="button"
                onClick={startEdit}
                className="shrink-0 text-[13px] font-medium text-ink hover:underline"
              >
                修改
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => setConfirming(true)}
                className="shrink-0 text-[13px] font-medium text-danger hover:underline disabled:opacity-50"
              >
                {deleting ? "刪除中…" : "刪除"}
              </button>
            </>
          )}
        </div>

        <div className="flex items-start gap-2">
          <input
            className={`${inputClass} flex-1`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addOption();
              }
            }}
            placeholder="新增選項…"
          />
          <Button disabled={pending} onClick={addOption}>
            {pending ? "新增中…" : "新增"}
          </Button>
        </div>

        {localGroup.options.length === 0 ? (
          <p className="text-[13px] lg:text-[14px] text-muted">尚無選項。</p>
        ) : (
          <ul className="divide-y divide-line rounded-lg border border-line">
            {localGroup.options.map((opt) =>
              editingOption === opt ? (
                <li key={opt} className="flex items-center gap-2 px-3 py-2 text-[13px] lg:text-[14px]">
                  <input
                    className={`${inputClass} flex-1`}
                    value={editOptionValue}
                    onChange={(e) => setEditOptionValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        commitEditOption();
                      }
                    }}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={commitEditOption}
                    className="shrink-0 text-xs font-medium text-brand hover:underline"
                  >
                    儲存
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingOption(null)}
                    className="shrink-0 text-xs font-medium text-muted hover:underline"
                  >
                    取消
                  </button>
                </li>
              ) : (
                <li
                  key={opt}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleOptionDrop(opt)}
                  className={`flex items-center justify-between gap-3 px-3 py-2 text-[13px] lg:text-[14px] ${
                    dragOption === opt ? "opacity-40" : ""
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <DragHandle
                      label={`拖曳排序：${opt}`}
                      onDragStart={() => setDragOption(opt)}
                      onDragEnd={() => setDragOption(null)}
                    />
                    {opt}
                  </span>
                  <div className="flex shrink-0 items-center gap-3">
                    <button
                      type="button"
                      onClick={() => startEditOption(opt)}
                      className="text-[13px] font-medium text-ink hover:underline"
                    >
                      修改
                    </button>
                    <button
                      type="button"
                      onClick={() => removeOption(opt)}
                      className="text-[13px] font-medium text-danger hover:underline"
                    >
                      刪除
                    </button>
                  </div>
                </li>
              ),
            )}
          </ul>
        )}
        {optionError && <p className="text-[13px] text-danger">{optionError}</p>}
      </CardBody>

      <Modal open={confirming} onClose={() => setConfirming(false)} ariaLabel="確認刪除標籤群組" className="max-w-sm">
        <ModalHeader title="確認刪除標籤群組" onClose={() => setConfirming(false)} />
        <div className="space-y-4 p-4">
          <p className="text-[13px] lg:text-[14px] text-ink">
            刪除「{localGroup.name}」會一併刪除底下所有選項，已套用在品項上的標籤不會自動移除。確定要刪除嗎？
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirming(false)}>
              否
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              是
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}

/** 放在 Section 標題列右側（見 admin/classification/page.tsx），固定在最上面，
 *  不會因為標籤群組越加越多而被往下擠。 */
export function AddTagGroupButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function createGroup() {
    startTransition(async () => {
      await createTagGroupAction();
      router.refresh();
    });
  }

  return (
    <Button disabled={pending} onClick={createGroup}>
      新增
    </Button>
  );
}

/** 群組卡片本身的拖曳排序——跟 NameListCard 同一套「本地先換順序、再打 action、失敗就還原」的做法，
 *  只是把把手放在卡片內（見 DragHandle），拖曳/放置的偵測範圍是外層 wrapper div。 */
export function TagGroupsManager({ groups }: { groups: TagGroupView[] }) {
  const router = useRouter();
  const [orderedGroups, setOrderedGroups] = useState(groups);
  const [dragId, setDragId] = useState<string | null>(null);
  const [reorderError, setReorderError] = useState<string | undefined>();

  useEffect(() => {
    setOrderedGroups(groups);
  }, [groups]);

  if (groups.length === 0) return null;

  function handleDrop(targetId: string) {
    if (!dragId || dragId === targetId) return;
    const from = orderedGroups.findIndex((g) => g.id === dragId);
    const to = orderedGroups.findIndex((g) => g.id === targetId);
    if (from === -1 || to === -1) return;

    const next = [...orderedGroups];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setOrderedGroups(next);
    setDragId(null);
    setReorderError(undefined);

    reorderTagGroupsAction(next.map((g) => g.id)).then((result) => {
      if (result.error) {
        setReorderError(result.error);
        setOrderedGroups(groups);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <div className="grid gap-4 sm:grid-cols-2">
        {orderedGroups.map((g) => (
          <div
            key={g.id}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(g.id)}
            className={dragId === g.id ? "opacity-40" : ""}
          >
            <TagGroupCard
              group={g}
              dragHandle={
                <DragHandle
                  label={`拖曳排序：${g.name}`}
                  onDragStart={() => setDragId(g.id)}
                  onDragEnd={() => setDragId(null)}
                />
              }
            />
          </div>
        ))}
      </div>
      {reorderError && <p className="text-[13px] text-danger">{reorderError}</p>}
    </div>
  );
}
