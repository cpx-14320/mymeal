"use client";

import { useActionState, useState } from "react";
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
    router.refresh();
    setEditPending(false);
    setEditingId(null);
  }

  return (
    <Card>
      <CardBody className="space-y-4">
        <div>
          <p className="font-medium">{title}</p>
          {description && <p className="text-xs text-muted">{description}</p>}
        </div>

        <form action={formAction} className="flex items-start gap-2">
          <input className={`${inputClass} flex-1`} name="name" placeholder={placeholder} required />
          <Button disabled={pending}>{pending ? "新增中…" : "新增"}</Button>
        </form>
        {state.error && <p className="text-sm text-danger">{state.error}</p>}

        {items.length === 0 ? (
          <p className="text-sm text-muted">目前沒有資料。</p>
        ) : (
          <ul className="divide-y divide-line rounded-lg border border-line">
            {items.map((item) =>
              editingId === item.id ? (
                <li key={item.id} className="flex items-center gap-2 px-3 py-2 text-sm">
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
                <li key={item.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                  <span>{item.name}</span>
                  <div className="flex shrink-0 items-center gap-3">
                    <button
                      type="button"
                      disabled={deletingId === item.id}
                      onClick={() => startEdit(item)}
                      className="text-xs font-medium text-ink hover:underline disabled:opacity-50"
                    >
                      修改
                    </button>
                    <button
                      type="button"
                      disabled={deletingId === item.id}
                      onClick={() => setConfirmTarget(item)}
                      className="text-xs font-medium text-danger hover:underline disabled:opacity-50"
                    >
                      {deletingId === item.id ? "刪除中…" : "刪除"}
                    </button>
                  </div>
                </li>
              ),
            )}
          </ul>
        )}

        {editError && <p className="text-sm text-danger">{editError}</p>}
        {deleteError && <p className="text-sm text-danger">{deleteError}</p>}
      </CardBody>

      <Modal open={confirmTarget !== null} onClose={() => setConfirmTarget(null)} ariaLabel={confirmTitle} className="max-w-sm">
        <ModalHeader title={confirmTitle} onClose={() => setConfirmTarget(null)} />
        <div className="space-y-4 p-4">
          <p className="text-sm text-ink">
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
