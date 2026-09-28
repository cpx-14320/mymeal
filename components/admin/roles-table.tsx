"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge, ButtonLink, TableWrap, Th, Td, BulkActionBar, DismissibleNote } from "@/components/ui/primitives";
import type { RoleView } from "@/lib/models/role";
import { deleteRolesAction } from "@/app/(app)/admin/roles/actions";
import { CreatedBanner } from "@/components/admin/created-banner";

export function RolesTable({ roles }: { roles: RoleView[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [deletedCount, setDeletedCount] = useState<number | null>(null);

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
    setDeletedCount(null);
    const result = await deleteRolesAction([...selected]);
    setSelected(new Set());
    setBusy(false);
    if (result.deleted > 0) setDeletedCount(result.deleted);
    if (result.blocked.length > 0) {
      setError(`「${result.blocked.join("、")}」還有會員套用，已略過未刪除。`);
    }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <CreatedBanner message="新增組別成功。" />

      <BulkActionBar
        count={selected.size}
        unit="個組別"
        onCancel={() => setSelected(new Set())}
        actions={[{ label: "刪除選取", tone: "danger", onClick: bulkDelete, disabled: busy }]}
      />

      {deletedCount !== null && (
        <DismissibleNote tone="positive" onClose={() => setDeletedCount(null)}>
          <p>已刪除 {deletedCount} 個組別。</p>
        </DismissibleNote>
      )}
      {error && <p className="text-[13px] lg:text-[14px] text-danger">{error}</p>}

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
                <Td>
                  <Link href={`/admin/roles/${r.id}`} className="hover:text-brand">
                    {r.name}
                  </Link>
                </Td>
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
