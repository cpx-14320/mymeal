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
  Note,
  paginate,
  DEFAULT_PAGE_SIZE,
} from "@/components/ui/primitives";
import type { NotificationView } from "@/lib/models/notification";
import { formatTaiwanDateTime } from "@/lib/date";
import { setNotificationsEnabledAction, deleteNotificationsAction } from "@/app/(app)/admin/notifications/actions";

export function NotificationsList({ notifications }: { notifications: NotificationView[] }) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [deleting, setDeleting] = useState(false);
  const [deletedMessage, setDeletedMessage] = useState<string | null>(null);

  const { pageRows: rows, pageCount, current, effectiveSize } = paginate(notifications, page, pageSize);

  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const pageAllSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));

  const togglePageAll = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (pageAllSelected) rows.forEach((r) => next.delete(r.id));
      else rows.forEach((r) => next.add(r.id));
      return next;
    });

  async function toggleEnabled(n: NotificationView) {
    setBusy(true);
    await setNotificationsEnabledAction([n.id], !n.enabled);
    setBusy(false);
    router.refresh();
  }

  async function bulkDelete() {
    setDeleting(true);
    const count = selected.size;
    await deleteNotificationsAction([...selected]);
    setSelected(new Set());
    setDeleting(false);
    setDeletedMessage(`已刪除 ${count} 筆資料`);
    setTimeout(() => setDeletedMessage(null), 3000);
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

      {deletedMessage && <Note tone="danger">{deletedMessage}</Note>}

      <BulkActionBar
        count={selected.size}
        unit="則"
        onCancel={() => setSelected(new Set())}
        actions={[
          { label: deleting ? "刪除中…" : "刪除選取", tone: "danger", onClick: bulkDelete, disabled: busy || deleting },
        ]}
      />

      <TableWrap>
        <thead>
          <tr>
            <Th className="w-10">
              <input type="checkbox" checked={pageAllSelected} onChange={togglePageAll} aria-label="選取本頁全部" />
            </Th>
            <Th>標題</Th>
            <Th>訊息內容</Th>
            <Th>連結</Th>
            <Th>建立時間</Th>
            <Th>狀態</Th>
            <Th className="text-right">操作</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((n) => (
            <tr key={n.id} className={selected.has(n.id) ? "bg-brand-soft" : ""}>
              <Td>
                <input
                  type="checkbox"
                  checked={selected.has(n.id)}
                  onChange={() => toggleOne(n.id)}
                  aria-label={`選取 ${n.title}`}
                />
              </Td>
              <Td>
                <Link href={`/admin/notifications/${n.id}`} className="hover:text-brand">
                  {n.title}
                </Link>
              </Td>
              <Td className="max-w-xs truncate text-muted">{n.message}</Td>
              <Td className="text-muted">{n.linkUrl || "—"}</Td>
              <Td className="text-muted tabular-nums">{formatTaiwanDateTime(n.createdAt)}</Td>
              <Td>
                <Badge tone={n.enabled ? "positive" : "neutral"}>{n.enabled ? "開啟" : "已關閉"}</Badge>
              </Td>
              <Td className="text-right">
                <div className="flex justify-end gap-2">
                  <ButtonLink href={`/admin/notifications/${n.id}`} variant="secondary" size="sm">
                    編輯
                  </ButtonLink>
                  <Button variant="secondary" size="sm" disabled={busy} onClick={() => toggleEnabled(n)}>
                    {n.enabled ? "關閉" : "開啟"}
                  </Button>
                </div>
              </Td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <Td className="text-center text-muted" colSpan={7}>
                還沒有任何通知訊息，點右上角「新增通知」開始建立。
              </Td>
            </tr>
          )}
        </tbody>
      </TableWrap>

      <Pagination page={current} pageCount={pageCount} total={notifications.length} pageSize={effectiveSize} onPage={setPage} unit="筆" />
    </div>
  );
}
