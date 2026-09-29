"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Button,
  Badge,
  TableWrap,
  Th,
  Td,
  Pagination,
  ListToolbar,
  DismissibleNote,
  paginate,
  DEFAULT_PAGE_SIZE,
} from "@/components/ui/primitives";
import type { FeedbackView } from "@/lib/models/feedback";
import { formatTaiwanDateTime } from "@/lib/date";
import { deleteFeedbackAction } from "@/app/(app)/admin/feedback/actions";

export function FeedbackList({ feedback }: { feedback: FeedbackView[] }) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleted, setDeleted] = useState(false);

  const { pageRows: rows, pageCount, current, effectiveSize } = paginate(feedback, page, pageSize);

  async function remove(id: string) {
    setBusyId(id);
    await deleteFeedbackAction(id);
    setBusyId(null);
    setDeleted(true);
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

      {deleted && (
        <DismissibleNote tone="positive" onClose={() => setDeleted(false)} autoDismissMs={5000}>
          <p>已刪除這筆意見回饋。</p>
        </DismissibleNote>
      )}

      <TableWrap>
        <thead>
          <tr>
            <Th>姓名</Th>
            <Th>時間</Th>
            <Th>類型</Th>
            <Th>內容</Th>
            <Th className="text-right">操作</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((f) => (
            <tr key={f.id}>
              <Td>
                {f.memberId ? (
                  <Link href={`/admin/insights/${f.memberId}`} className="hover:text-brand">
                    {f.senderName}
                  </Link>
                ) : (
                  f.senderName
                )}
              </Td>
              <Td className="text-muted tabular-nums">{formatTaiwanDateTime(f.createdAt)}</Td>
              <Td>
                <Badge tone="neutral">{f.type}</Badge>
              </Td>
              <Td className="max-w-md">
                <p className="whitespace-pre-wrap break-words text-ink">{f.content}</p>
              </Td>
              <Td className="text-right">
                <Button variant="secondary" size="sm" disabled={busyId === f.id} onClick={() => remove(f.id)}>
                  刪除
                </Button>
              </Td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <Td className="text-center text-muted" colSpan={5}>
                目前沒有任何意見回饋
              </Td>
            </tr>
          )}
        </tbody>
      </TableWrap>

      <Pagination page={current} pageCount={pageCount} total={feedback.length} pageSize={effectiveSize} onPage={setPage} unit="筆" />
    </div>
  );
}
