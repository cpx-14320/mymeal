"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, inputClass, Button } from "@/components/ui/primitives";
import { Modal, ModalHeader } from "@/components/ui/modal";

export interface NameListItem {
  id: string;
  name: string;
}

export interface NameListFormState {
  error?: string;
  success?: boolean;
}

export interface NameListActionState {
  error?: string;
  success?: boolean;
}

interface NameListCardProps {
  title: string;
  description?: string;
  placeholder: string;
  items: NameListItem[];
  createAction: (state: NameListFormState, formData: FormData) => Promise<NameListFormState>;
  updateAction: (id: string, name: string) => Promise<NameListActionState>;
  deleteAction: (id: string) => Promise<NameListActionState>;
  /** 有傳的話，列表可以拖曳排序（拖放後呼叫這個把新順序存回去）。 */
  reorderAction?: (orderedIds: string[]) => Promise<NameListActionState>;
  /** "list"（預設）：直式清單，逐列排列。"grid"：多欄網格，項目排成小卡片、依畫面寬度自動幾欄。 */
  layout?: "list" | "grid";
  confirmTitle: string;
  /** 用 {name} 當佔位符，例如 "刪除「{name}」會連同底下單位一起刪除，確定要刪除嗎？"。 */
  confirmMessage: string;
}

const initialState: NameListFormState = {};

/**
 * 純名稱清單（部門／單位／品項類型／品項分類…）共用的管理卡片：
 * 新增表單 + 邊框列表，列表每一列可就地改名、刪除前跳確認彈窗。
 * 只吃 { id, name } 形狀的資料——結構更複雜（有巢狀選項、需要分組）的清單不適用。
 */
export function NameListCard({
  title,
  description,
  placeholder,
  items,
  createAction,
  updateAction,
  deleteAction,
  reorderAction,
  layout = "list",
  confirmTitle,
  confirmMessage,
}: NameListCardProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createAction, initialState);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | undefined>();
  const [confirmTarget, setConfirmTarget] = useState<NameListItem | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editPending, setEditPending] = useState(false);
  const [editError, setEditError] = useState<string | undefined>();
  const [orderedItems, setOrderedItems] = useState(items);
  const [dragId, setDragId] = useState<string | null>(null);
  const [reorderError, setReorderError] = useState<string | undefined>();

  useEffect(() => {
    setOrderedItems(items);
  }, [items]);

  function handleDrop(targetId: string) {
    if (!dragId || dragId === targetId) return;
    const from = orderedItems.findIndex((i) => i.id === dragId);
    const to = orderedItems.findIndex((i) => i.id === targetId);
    if (from === -1 || to === -1) return;

    const next = [...orderedItems];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setOrderedItems(next);
    setDragId(null);

    if (!reorderAction) return;
    setReorderError(undefined);
    reorderAction(next.map((i) => i.id)).then((result) => {
      if (result.error) {
        setReorderError(result.error);
        setOrderedItems(items);
        return;
      }
      router.refresh();
    });
  }

  async function handleDelete(id: string) {
    setConfirmTarget(null);
    setDeletingId(id);
    setDeleteError(undefined);
    const result = await deleteAction(id);
    if (result.error) {
      setDeleteError(result.error);
      setDeletingId(null);
      return;
    }
    router.refresh();
    setDeletingId(null);
  }

  function startEdit(item: NameListItem) {
    setEditingId(item.id);
    setEditValue(item.name);
    setEditError(undefined);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditError(undefined);
  }

  async function handleUpdate(id: string) {
    setEditPending(true);
    setEditError(undefined);
    const result = await updateAction(id, editValue);
    if (result.error) {
      setEditError(result.error);
      setEditPending(false);
      return;
    }
    setOrderedItems((prev) => prev.map((it) => (it.id === id ? { ...it, name: editValue } : it)));
    router.refresh();
    setEditPending(false);
    setEditingId(null);
  }

  return (
    <Card>
      <CardBody className="space-y-4">
        <div>
          <p className="font-medium">{title}</p>
          {description && <p className="text-[13px] lg:text-[14px] text-muted">{description}</p>}
        </div>

        <form action={formAction} className="flex items-start gap-2">
          <input className={`${inputClass} h-9 flex-1`} name="name" placeholder={placeholder} required />
          <Button disabled={pending}>{pending ? "新增中…" : "新增"}</Button>
        </form>
        {state.error && <p className="text-[13px] text-danger">{state.error}</p>}

        {orderedItems.length === 0 ? (
          <p className="text-[13px] lg:text-[14px] text-muted">目前沒有資料。</p>
        ) : (
          <ul
            className={
              layout === "grid"
                ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                : "divide-y divide-line rounded-lg border border-line"
            }
          >
            {orderedItems.map((item) =>
              editingId === item.id ? (
                <li
                  key={item.id}
                  className={
                    layout === "grid"
                      ? "flex flex-wrap items-center gap-2 rounded-lg border border-line px-3 py-2 text-[13px] lg:text-[14px]"
                      : "flex items-center gap-2 px-3 py-2 text-[13px] lg:text-[14px]"
                  }
                >
                  <input
                    className={`${inputClass} flex-1`}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    disabled={editPending}
                    autoFocus
                  />
                  <button
                    type="button"
                    disabled={editPending}
                    onClick={() => handleUpdate(item.id)}
                    className="text-xs font-medium text-brand hover:underline disabled:opacity-50"
                  >
                    {editPending ? "儲存中…" : "儲存"}
                  </button>
                  <button
                    type="button"
                    disabled={editPending}
                    onClick={cancelEdit}
                    className="text-xs font-medium text-muted hover:underline disabled:opacity-50"
                  >
                    取消
                  </button>
                </li>
              ) : (
                <li
                  key={item.id}
                  draggable={!!reorderAction}
                  onDragStart={() => setDragId(item.id)}
                  onDragOver={(e) => reorderAction && e.preventDefault()}
                  onDrop={() => handleDrop(item.id)}
                  onDragEnd={() => setDragId(null)}
                  className={`flex items-center justify-between gap-3 text-[13px] lg:text-[14px] ${
                    layout === "grid" ? "rounded-lg border border-line px-3 py-2" : "px-3 py-2"
                  } ${reorderAction ? "cursor-grab active:cursor-grabbing" : ""} ${
                    dragId === item.id ? "opacity-40" : ""
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {reorderAction && <span className="text-muted select-none">⠿</span>}
                    {item.name}
                  </span>
                  <div className="flex shrink-0 items-center gap-3">
                    <button
                      type="button"
                      disabled={deletingId === item.id}
                      onClick={() => startEdit(item)}
                      className="text-[13px] font-medium text-ink hover:underline disabled:opacity-50"
                    >
                      修改
                    </button>
                    <button
                      type="button"
                      disabled={deletingId === item.id}
                      onClick={() => setConfirmTarget(item)}
                      className="text-[13px] font-medium text-danger hover:underline disabled:opacity-50"
                    >
                      {deletingId === item.id ? "刪除中…" : "刪除"}
                    </button>
                  </div>
                </li>
              ),
            )}
          </ul>
        )}

        {editError && <p className="text-[13px] text-danger">{editError}</p>}
        {deleteError && <p className="text-[13px] text-danger">{deleteError}</p>}
        {reorderError && <p className="text-[13px] text-danger">{reorderError}</p>}
      </CardBody>

      <Modal open={confirmTarget !== null} onClose={() => setConfirmTarget(null)} ariaLabel={confirmTitle} className="max-w-sm">
        <ModalHeader title={confirmTitle} onClose={() => setConfirmTarget(null)} />
        <div className="space-y-4 p-4">
          <p className="text-[13px] lg:text-[14px] text-ink">
            {confirmTarget ? confirmMessage.replace("{name}", confirmTarget.name) : ""}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmTarget(null)}>
              否
            </Button>
            <Button variant="danger" onClick={() => confirmTarget && handleDelete(confirmTarget.id)}>
              是
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}
