"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, Field, inputClass, Button, ButtonLink } from "@/components/ui/primitives";
import { permissionCategories } from "@/lib/mock";
import type { RoleView } from "@/lib/models/role";
import { createRoleAction, type CreateRoleState } from "@/app/(app)/admin/roles/new/actions";
import { updateRoleAction, deleteRoleAction, type UpdateRoleState } from "@/app/(app)/admin/roles/[id]/actions";

/** 新增 / 編輯組別共用的表單。傳 role 就是編輯模式（欄位帶入現值＋多一個刪除按鈕）。 */
export function RoleForm({ role }: { role?: RoleView }) {
  const router = useRouter();
  const isEdit = !!role;
  const action = isEdit ? updateRoleAction.bind(null, role.id) : createRoleAction;
  const [state, formAction, pending] = useActionState<CreateRoleState | UpdateRoleState, FormData>(
    action,
    {},
  );
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | undefined>();

  useEffect(() => {
    if (isEdit && state.success) router.refresh();
  }, [isEdit, state.success, router]);

  async function handleDelete() {
    if (!role) return;
    setDeleting(true);
    setDeleteError(undefined);
    const result = await deleteRoleAction(role.id);
    if (result.error) {
      setDeleteError(result.error);
      setDeleting(false);
      return;
    }
    router.push("/admin/roles");
    router.refresh();
  }

  return (
    <form action={formAction}>
      <Card>
        <CardBody className="space-y-5">
          <Field label="組別名稱">
            <input
              className={inputClass}
              name="name"
              defaultValue={role?.name}
              placeholder="例：客服管理員"
              required
            />
          </Field>

          <div>
            <span className="mb-1.5 block text-sm font-medium">權限</span>
            <p className="mb-2 text-xs text-muted">
              勾選這個組別可以使用的權限（依後台側欄分類）；套用這個組別的會員都會套用同一份設定。
            </p>
            <div className="space-y-3">
              {permissionCategories.map((cat) => (
                <div key={cat.key} className="overflow-hidden rounded-lg border border-line">
                  <p className="bg-surface-2 px-3 py-1.5 text-xs font-medium text-muted">{cat.label}</p>
                  <div className="divide-y divide-line">
                    {cat.items.map((p) => (
                      <label
                        key={p.key}
                        className="flex cursor-pointer items-center justify-between gap-4 px-3 py-2.5 pl-6 hover:bg-surface-2"
                      >
                        <span className="font-mono text-xs text-muted">{p.label}</span>
                        <input
                          type="checkbox"
                          name="permissions"
                          value={p.key}
                          className="h-4 w-4 rounded border-line accent-brand"
                          defaultChecked={role?.permissions[p.key] ?? false}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {state.error && <p className="text-sm text-danger">{state.error}</p>}
        </CardBody>
      </Card>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        {isEdit ? (
          <div className="flex items-center gap-3">
            <Button type="button" variant="danger" disabled={deleting} onClick={handleDelete}>
              {deleting ? "刪除中…" : "刪除組別"}
            </Button>
            {deleteError && <p className="text-sm text-danger">{deleteError}</p>}
          </div>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <ButtonLink href="/admin/roles" variant="ghost">
            {isEdit ? "返回列表" : "取消"}
          </ButtonLink>
          <Button disabled={pending}>{pending ? "儲存中…" : isEdit ? "儲存" : "建立組別"}</Button>
        </div>
      </div>
    </form>
  );
}
