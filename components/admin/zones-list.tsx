"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Button,
  ButtonLink,
  Badge,
  TableWrap,
  Th,
  Td,
  Pagination,
  ListToolbar,
  BulkActionBar,
} from "@/components/ui/primitives";
import type { OrderZoneView } from "@/lib/models/order-zone";
import { setZonesActiveAction, deleteZonesAction } from "@/app/(app)/admin/zones/actions";

export function ZonesList({
  zones: initialZones,
  templateNameById,
}: {
  zones: OrderZoneView[];
  templateNameById: Record<string, string>;
}) {
  const router = useRouter();
  const zones = [...initialZones].sort((a, b) => a.sortOrder - b.sortOrder);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [busy, setBusy] = useState(false);

  const pageCount = Math.max(1, Math.ceil(zones.length / pageSize));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * pageSize;
  const rows = zones.slice(start, start + pageSize);

  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const pageAllSelected = rows.length > 0 && rows.every((z) => selected.has(z.id));

  const togglePageAll = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (pageAllSelected) rows.forEach((z) => next.delete(z.id));
      else rows.forEach((z) => next.add(z.id));
      return next;
    });

  async function bulkSetActive(active: boolean) {
    setBusy(true);
    await setZonesActiveAction([...selected], active);
    setSelected(new Set());
    setBusy(false);
    router.refresh();
  }

  async function toggleActive(z: OrderZoneView) {
    setBusy(true);
    await setZonesActiveAction([z.id], !z.active);
    setBusy(false);
    router.refresh();
  }

  async function bulkDelete() {
    setBusy(true);
    await deleteZonesAction([...selected]);
    setSelected(new Set());
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <ListToolbar
        pageSize={pageSize}
        onPageSizeChange={(n) => {
          setPageSize(n);
          setPage(1);
        }}
      />

      <BulkActionBar
        count={selected.size}
        unit="個"
        onCancel={() => setSelected(new Set())}
        actions={[
          { label: "上架選取", tone: "neutral", onClick: () => bulkSetActive(true), disabled: busy },
          { label: "下架選取", tone: "neutral", onClick: () => bulkSetActive(false), disabled: busy },
          { label: "刪除選取", tone: "danger", onClick: bulkDelete, disabled: busy },
        ]}
      />

      <TableWrap>
        <thead>
          <tr>
            <Th className="w-10">
              <input type="checkbox" checked={pageAllSelected} onChange={togglePageAll} aria-label="選取本頁全部" />
            </Th>
            <Th>專區</Th>
            <Th>代稱</Th>
            <Th>套用模板</Th>
            <Th>狀態</Th>
            <Th className="text-right">排序</Th>
            <Th className="text-right">操作</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((z) => (
            <tr key={z.id} className={selected.has(z.id) ? "bg-brand-soft" : ""}>
              <Td>
                <input
                  type="checkbox"
                  checked={selected.has(z.id)}
                  onChange={() => toggleOne(z.id)}
                  aria-label={`選取 ${z.name}`}
                />
              </Td>
              <Td>
                <span className="mr-1.5">{z.icon}</span>
                <Link href={`/admin/zones/${z.id}`} className="hover:text-brand">
                  {z.name}
                </Link>
              </Td>
              <Td className="font-mono text-muted">/z/{z.slug}</Td>
              <Td className="text-muted">
                {z.templateIds.length === 0 ? "—" : z.templateIds.map((tid) => templateNameById[tid] ?? tid).join("、")}
              </Td>
              <Td>
                <Badge tone={z.active ? "positive" : "neutral"}>{z.active ? "上架" : "下架"}</Badge>
              </Td>
              <Td className="text-right tabular-nums">{z.sortOrder}</Td>
              <Td className="text-right">
                <div className="flex justify-end gap-2">
                  <ButtonLink href={`/admin/zones/${z.id}`} variant="secondary" size="sm">
                    編輯
                  </ButtonLink>
                  <Button variant="secondary" size="sm" disabled={busy} onClick={() => toggleActive(z)}>
                    {z.active ? "下架" : "上架"}
                  </Button>
                </div>
              </Td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <Td className="text-center text-muted" colSpan={7}>
                還沒有訂餐專區，點右上角「新增專區」開始建立。
              </Td>
            </tr>
          )}
        </tbody>
      </TableWrap>

      <Pagination page={current} pageCount={pageCount} total={zones.length} pageSize={pageSize} onPage={setPage} unit="筆" />
    </div>
  );
}
