"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, ButtonLink, TableWrap, Th, Td } from "@/components/ui/primitives";
import type { RoleView } from "@/lib/models/role";
import { deleteRolesAction } from "@/app/(app)/admin/roles/actions";

export function RolesTable({ roles }: { roles: RoleView[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const allSelected = roles.length > 0 && roles.every((r) => selected.has(r.id));

  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(roles.map((r) => r.id)));

  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  async function bulkDelete() {
    setBusy(true);
    setError(undefined);
    const result = await deleteRolesAction([...selected]);
    setSelected(new Set());
    setBusy(false);
    if (result.blocked.length > 0) {
      setError(`「${result.blocked.join("、")}」還有會員套用，已略過未刪除。`);
    }
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface-2 px-4 py-2.5 text-sm">
          <span>
            已選 <b className="tabular-nums">{selected.size}</b> 個組別
          </span>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setSelected(new Set())} className="text-muted hover:text-ink">
              取消選取
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={bulkDelete}
              className="rounded-lg border border-danger/40 px-3 py-1 font-semibold text-danger hover:bg-danger/10 disabled:opacity-50"
            >
              刪除選取
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      <TableWrap>
        <thead>
          <tr>
            <Th className="w-10">
              <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="選取全部" />
            </Th>
            <Th>組別名稱</Th>
            <Th>權限</Th>
            <Th>套用人數</Th>
            <Th className="text-right">操作</Th>
          </tr>
        </thead>
        <tbody>
          {roles.length === 0 ? (
            <tr>
              <Td colSpan={5} className="text-center text-muted">
                目前沒有組別。
              </Td>
            </tr>
          ) : (
            roles.map((r) => (
              <tr key={r.id} className={selected.has(r.id) ? "bg-brand-soft" : ""}>
                <Td>
                  <input
                    type="checkbox"
                    checked={selected.has(r.id)}
                    onChange={() => toggleOne(r.id)}
                    aria-label={`選取 ${r.name}`}
                  />
                </Td>
                <Td className="font-medium">{r.name}</Td>
                <Td>
                  <Badge>{r.permCount} 項權限</Badge>
                </Td>
                <Td>
                  <Badge tone="brand">{r.memberCount} 人</Badge>
                </Td>
                <Td className="text-right">
                  <ButtonLink href={`/admin/roles/${r.id}`} variant="secondary" size="sm">
                    編輯
                  </ButtonLink>
                </Td>
              </tr>
            ))
          )}
        </tbody>
      </TableWrap>
    </div>
  );
}
