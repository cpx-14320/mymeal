"use client";

import { useState, useTransition } from "react";
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
} from "@/app/(app)/admin/items/tags/actions";

/** 單一標籤群組卡片：名稱可就地改名（跟 NameListCard 同一種「修改→儲存/取消」互動），
 *  單複選切換、選項 chip 新增/移除，刪除前跳確認彈窗——跟「類型」「分類」卡片同一套視覺語言。 */
function TagGroupCard({ group }: { group: TagGroupView }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [nameValue, setNameValue] = useState(group.name);
  const [draft, setDraft] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editingOption, setEditingOption] = useState<string | null>(null);
  const [editOptionValue, setEditOptionValue] = useState("");

  function startEdit() {
    setNameValue(group.name);
    setEditing(true);
  }

  function commitName() {
    const value = nameValue.trim();
    setEditing(false);
    if (!value || value === group.name) return;
    startTransition(async () => {
      await renameTagGroupAction(group.id, value);
      router.refresh();
    });
  }

  function toggleMulti() {
    startTransition(async () => {
      await toggleTagGroupMultiAction(group.id, !group.multi);
      router.refresh();
    });
  }

  function addOption() {
    const v = draft.trim();
    if (!v) return;
    startTransition(async () => {
      await addTagOptionAction(group.id, v);
      router.refresh();
    });
    setDraft("");
  }

  function removeOption(option: string) {
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
              <p className="flex-1 font-medium">{group.name}</p>
              <button
                type="button"
                onClick={() => toggleMulti()}
                className="shrink-0 rounded-full border border-line px-2 py-0.5 text-xs text-muted hover:text-ink"
              >
                {group.multi ? "可複選" : "單選"}
              </button>
              <button
                type="button"
                onClick={startEdit}
                className="shrink-0 text-xs font-medium text-ink hover:underline"
              >
                修改
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => setConfirming(true)}
                className="shrink-0 text-xs font-medium text-danger hover:underline disabled:opacity-50"
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

        {group.options.length === 0 ? (
          <p className="text-sm text-muted">尚無選項。</p>
        ) : (
          <ul className="divide-y divide-line rounded-lg border border-line">
            {group.options.map((opt) =>
              editingOption === opt ? (
                <li key={opt} className="flex items-center gap-2 px-3 py-2 text-sm">
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
                <li key={opt} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                  <span>{opt}</span>
                  <div className="flex shrink-0 items-center gap-3">
                    <button
                      type="button"
                      onClick={() => startEditOption(opt)}
                      className="text-xs font-medium text-ink hover:underline"
                    >
                      修改
                    </button>
                    <button
                      type="button"
                      onClick={() => removeOption(opt)}
                      className="text-xs font-medium text-danger hover:underline"
                    >
                      刪除
                    </button>
                  </div>
                </li>
              ),
            )}
          </ul>
        )}
      </CardBody>

      <Modal open={confirming} onClose={() => setConfirming(false)} ariaLabel="確認刪除標籤群組" className="max-w-sm">
        <ModalHeader title="確認刪除標籤群組" onClose={() => setConfirming(false)} />
        <div className="space-y-4 p-4">
          <p className="text-sm text-ink">
            刪除「{group.name}」會一併刪除底下所有選項，已套用在品項上的標籤不會自動移除。確定要刪除嗎？
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
      新增標籤群組
    </Button>
  );
}

export function TagGroupsManager({ groups }: { groups: TagGroupView[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {groups.map((g) => (
        <TagGroupCard key={g.id} group={g} />
      ))}
    </div>
  );
}
