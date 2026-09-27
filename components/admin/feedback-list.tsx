"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Badge,
  TableWrap,
  Th,
  Td,
  Pagination,
  ListToolbar,
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

  const { pageRows: rows, pageCount, current, effectiveSize } = paginate(feedback, page, pageSize);

  async function remove(id: string) {
    if (!confirm("確定要刪除這筆意見回饋嗎？")) return;
    setBusyId(id);
    await deleteFeedbackAction(id);
    setBusyId(null);
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
            <Th>寄件者</Th>
            <Th>時間</Th>
            <Th>內容</Th>
            <Th className="text-right">操作</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((f) => (
            <tr key={f.id}>
              <Td>{f.senderName}</Td>
              <Td className="text-muted tabular-nums">{formatTaiwanDateTime(f.createdAt)}</Td>
              <Td className="max-w-md">
                <div className="mb-1">
                  <Badge tone="neutral">{f.type}</Badge>
                </div>
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
              <Td className="text-center text-muted" colSpan={4}>
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
