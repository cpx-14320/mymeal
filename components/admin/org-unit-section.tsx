"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, inputClass, Button } from "@/components/ui/primitives";
import type { OrgOption, UnitOption } from "@/lib/models/org";
import type { OrgFormState, DeleteOrgState } from "@/app/(app)/admin/org/actions";

const initialState: OrgFormState = {};

interface OrgUnitSectionProps {
  units: UnitOption[];
  departments: OrgOption[];
  createAction: (state: OrgFormState, formData: FormData) => Promise<OrgFormState>;
  updateAction: (id: string, name: string) => Promise<DeleteOrgState>;
  deleteAction: (id: string) => Promise<DeleteOrgState>;
}

/** 單位管理：依所屬部門分組顯示，新增時要選部門——單位一律隸屬於一個部門。 */
export function OrgUnitSection({
  units,
  departments,
  createAction,
  updateAction,
  deleteAction,
}: OrgUnitSectionProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createAction, initialState);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | undefined>();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editPending, setEditPending] = useState(false);
  const [editError, setEditError] = useState<string | undefined>();

  async function handleDelete(id: string) {
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

  function startEdit(item: UnitOption) {
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

  const groups = departments
    .map((dept) => ({ dept, items: units.filter((u) => u.departmentId === dept.id) }))
    .filter((g) => g.items.length > 0);

  return (
    <Card>
      <CardBody className="space-y-4">
        <div>
          <p className="font-medium">單位</p>
          <p className="text-[13px] lg:text-[14px] text-muted">
            部門底下的課別，依所屬部門分組顯示；會員註冊、編輯會員時可選擇。
          </p>
        </div>

        <form action={formAction} className="space-y-2">
          <div className="flex items-start gap-2">
            <select
              className={`${inputClass} h-9 !w-32 shrink-0`}
              name="departmentId"
              required
              defaultValue=""
            >
              <option value="" disabled>
                所屬部門
              </option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <input
              className={`${inputClass} h-9 flex-1`}
              name="name"
              placeholder="例：數位推展課"
              required
            />
            <Button disabled={pending}>{pending ? "新增中…" : "新增"}</Button>
          </div>
          {state.error && <p className="text-[13px] lg:text-[14px] text-danger">{state.error}</p>}
        </form>

        {groups.length === 0 ? (
          <p className="text-[13px] lg:text-[14px] text-muted">目前沒有資料。</p>
        ) : (
          <div className="space-y-3">
            {groups.map(({ dept, items }) => (
              <div key={dept.id} className="overflow-hidden rounded-lg border border-line">
                <p className="bg-surface-2 px-3 py-1.5 text-xs font-medium text-muted">
                  {dept.name}
                </p>
                <ul className="divide-y divide-line">
                  {items.map((item) =>
                    editingId === item.id ? (
                      <li
                        key={item.id}
                        className="flex items-center gap-2 px-3 py-2 pl-4 text-[13px] lg:text-[14px]"
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
                        className="flex items-center justify-between gap-3 px-3 py-2 pl-4 text-[13px] lg:text-[14px]"
                      >
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
                            onClick={() => handleDelete(item.id)}
                            className="text-xs font-medium text-danger hover:underline disabled:opacity-50"
                          >
                            {deletingId === item.id ? "刪除中…" : "刪除"}
                          </button>
                        </div>
                      </li>
                    ),
                  )}
                </ul>
              </div>
            ))}
          </div>
        )}

        {editError && <p className="text-[13px] lg:text-[14px] text-danger">{editError}</p>}
        {deleteError && <p className="text-[13px] lg:text-[14px] text-danger">{deleteError}</p>}
      </CardBody>
    </Card>
  );
}
