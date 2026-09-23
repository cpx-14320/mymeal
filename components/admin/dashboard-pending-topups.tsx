"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, TableWrap, Th, Td } from "@/components/ui/primitives";
import type { TopupRequestView } from "@/lib/models/topup-request";
import { formatTaiwanDateTime } from "@/lib/date";
import { approveTopupAction, rejectTopupAction, deleteTopupAction } from "@/app/(app)/admin/topups/actions";

/** 總覽儀表板用的縮小版待審儲值表格，跟 topups-tables.tsx 走同一套核准／退件邏輯。 */
export function DashboardPendingTopups({ requests }: { requests: TopupRequestView[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | undefined>();

  async function approve(id: string) {
    setBusyId(id);
    setError(undefined);
    const result = await approveTopupAction(id);
    setBusyId(null);
    if (result.error) setError(result.error);
    router.refresh();
  }

  async function reject(id: string) {
    setBusyId(id);
    setError(undefined);
    const result = await rejectTopupAction(id);
    setBusyId(null);
    if (result.error) setError(result.error);
    router.refresh();
  }

  async function remove(id: string) {
    setBusyId(id);
    setError(undefined);
    const result = await deleteTopupAction(id);
    setBusyId(null);
    if (result.error) setError(result.error);
    router.refresh();
  }

  if (requests.length === 0) {
    return <p className="text-[13px] lg:text-[14px] text-muted">目前沒有待審核的儲值申請。</p>;
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-[13px] lg:text-[14px] text-danger">{error}</p>}
      <TableWrap>
        <thead>
          <tr>
            <Th>申請人</Th>
            <Th>單位</Th>
            <Th className="text-right">金額</Th>
            <Th>方式</Th>
            <Th>時間</Th>
            <Th className="text-right">操作</Th>
          </tr>
        </thead>
        <tbody>
          {requests.map((t) => (
            <tr key={t.id}>
              <Td>{t.memberName}</Td>
              <Td className="text-muted">{t.dept || "—"}</Td>
              <Td className="text-right tabular-nums">NT$ {t.amount}</Td>
              <Td>{t.method}</Td>
              <Td className="text-muted">{formatTaiwanDateTime(t.at)}</Td>
              <Td className="text-right">
                <div className="flex justify-end gap-2">
                  <Button size="sm" disabled={busyId === t.id} onClick={() => approve(t.id)}>
                    核准
                  </Button>
                  <Button variant="danger" size="sm" disabled={busyId === t.id} onClick={() => reject(t.id)}>
                    退件
                  </Button>
                  <Button variant="secondary" size="sm" disabled={busyId === t.id} onClick={() => remove(t.id)}>
                    刪除
                  </Button>
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
    </div>
  );
}
