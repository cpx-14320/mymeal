"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, ButtonLink, Badge, TableWrap, Th, Td, Pagination, ListToolbar } from "@/components/ui/primitives";
import type { NotificationView } from "@/lib/models/notification";
import { formatTaiwanDateTime } from "@/lib/date";
import { setNotificationsEnabledAction } from "@/app/(app)/admin/notifications/actions";

export function NotificationsList({ notifications }: { notifications: NotificationView[] }) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [busy, setBusy] = useState(false);

  const pageCount = Math.max(1, Math.ceil(notifications.length / pageSize));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * pageSize;
  const rows = notifications.slice(start, start + pageSize);

  async function toggleEnabled(n: NotificationView) {
    setBusy(true);
    await setNotificationsEnabledAction([n.id], !n.enabled);
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

      <TableWrap>
        <thead>
          <tr>
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
            <tr key={n.id}>
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
              <Td className="text-center text-muted" colSpan={6}>
                還沒有任何通知訊息，點右上角「新增通知」開始建立。
              </Td>
            </tr>
          )}
        </tbody>
      </TableWrap>

      <Pagination page={current} pageCount={pageCount} total={notifications.length} pageSize={pageSize} onPage={setPage} unit="筆" />
    </div>
  );
}
