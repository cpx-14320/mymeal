"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Section,
  Button,
  Badge,
  TableWrap,
  Th,
  Td,
  Pagination,
  PageSizeSelect,
  PillTabs,
} from "@/components/ui/primitives";
import type { TopupRequestView } from "@/lib/models/topup-request";
import { formatTaiwanDateTime } from "@/lib/date";
import { approveTopupAction, rejectTopupAction } from "@/app/(app)/admin/topups/actions";

function paginate<T>(rows: T[], page: number, size: number) {
  const pageCount = Math.max(1, Math.ceil(rows.length / size));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * size;
  return { pageCount, current, rows: rows.slice(start, start + size) };
}

const st = {
  approved: { label: "已核准", tone: "positive" as const },
  rejected: { label: "已退件", tone: "danger" as const },
};

type Tab = "pending" | "approved" | "rejected" | "all";

export function TopupsTables({ requests }: { requests: TopupRequestView[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("pending");
  const [pPage, setPPage] = useState(1);
  const [aPage, setAPage] = useState(1);
  const [rPage, setRPage] = useState(1);
  const [allPage, setAllPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | undefined>();

  const pending = requests.filter((r) => r.status === "pending");
  const approved = requests.filter((r) => r.status === "approved");
  const rejected = requests.filter((r) => r.status === "rejected");
  const processedAll = [...approved, ...rejected].sort((a, b) => b.at.getTime() - a.at.getTime());

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "pending", label: "待審核", count: pending.length },
    { key: "approved", label: "已核准", count: approved.length },
    { key: "rejected", label: "已退件", count: rejected.length },
    { key: "all", label: "全部", count: processedAll.length },
  ];

  const tabDescription: Record<Tab, string> = {
    pending: "核准後餘額才會增加並寫入交易明細。",
    approved: "已核准的儲值申請紀錄。",
    rejected: "已退件的儲值申請紀錄。",
    all: "已核准與已退件的完整紀錄。",
  };

  const p = paginate(pending, pPage, pageSize);
  const a = paginate(approved, aPage, pageSize);
  const r = paginate(rejected, rPage, pageSize);
  const all = paginate(processedAll, allPage, pageSize);

  const processedTabs = { approved: a, rejected: r, all };

  const changeSize = (n: number) => {
    setPageSize(n);
    setPPage(1);
    setAPage(1);
    setRPage(1);
    setAllPage(1);
  };

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

  return (
    <Section title="儲值審核" description={tabDescription[tab]}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <PillTabs tabs={tabs} value={tab} onChange={setTab} />
        <PageSizeSelect value={pageSize} onChange={changeSize} />
      </div>

      {error && <p className="mb-3 text-sm text-danger">{error}</p>}

      {tab === "pending" ? (
        <>
          <TableWrap>
            <thead>
              <tr>
                <Th>申請人</Th>
                <Th>部門</Th>
                <Th className="text-right">金額</Th>
                <Th>方式</Th>
                <Th>末五碼</Th>
                <Th>時間</Th>
                <Th className="text-right">操作</Th>
              </tr>
            </thead>
            <tbody>
              {p.rows.length === 0 ? (
                <tr>
                  <Td colSpan={7} className="text-center text-muted">
                    目前沒有待審核的申請。
                  </Td>
                </tr>
              ) : (
                p.rows.map((req) => (
                  <tr key={req.id}>
                    <Td className="font-medium">{req.memberName}</Td>
                    <Td className="text-muted">{req.dept}</Td>
                    <Td className="text-right tabular-nums">NT$ {req.amount}</Td>
                    <Td>{req.method}</Td>
                    <Td className="tabular-nums text-muted">{req.code || "—"}</Td>
                    <Td className="whitespace-nowrap text-muted">{formatTaiwanDateTime(req.at)}</Td>
                    <Td className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" disabled={busyId === req.id} onClick={() => approve(req.id)}>
                          核准
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          disabled={busyId === req.id}
                          onClick={() => reject(req.id)}
                        >
                          退件
                        </Button>
                      </div>
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </TableWrap>
          <Pagination
            page={p.current}
            pageCount={p.pageCount}
            total={pending.length}
            pageSize={pageSize}
            onPage={setPPage}
          />
        </>
      ) : (
        <>
          <TableWrap>
            <thead>
              <tr>
                <Th>申請人</Th>
                <Th>部門</Th>
                <Th className="text-right">金額</Th>
                <Th>方式</Th>
                <Th>時間</Th>
                {tab === "all" && <Th>結果</Th>}
              </tr>
            </thead>
            <tbody>
              {processedTabs[tab].rows.length === 0 ? (
                <tr>
                  <Td colSpan={tab === "all" ? 6 : 5} className="text-center text-muted">
                    沒有資料。
                  </Td>
                </tr>
              ) : (
                processedTabs[tab].rows.map((req) => (
                  <tr key={req.id}>
                    <Td className="font-medium">{req.memberName}</Td>
                    <Td className="text-muted">{req.dept}</Td>
                    <Td className="text-right tabular-nums">NT$ {req.amount}</Td>
                    <Td>{req.method}</Td>
                    <Td className="whitespace-nowrap text-muted">{formatTaiwanDateTime(req.at)}</Td>
                    {tab === "all" && (
                      <Td>
                        <Badge tone={st[req.status as "approved" | "rejected"].tone}>
                          {st[req.status as "approved" | "rejected"].label}
                        </Badge>
                      </Td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </TableWrap>
          <Pagination
            page={processedTabs[tab].current}
            pageCount={processedTabs[tab].pageCount}
            total={
              tab === "approved" ? approved.length : tab === "rejected" ? rejected.length : processedAll.length
            }
            pageSize={pageSize}
            onPage={tab === "approved" ? setAPage : tab === "rejected" ? setRPage : setAllPage}
          />
        </>
      )}
    </Section>
  );
}
