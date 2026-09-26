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
  ListToolbar,
  BulkActionBar,
  paginate,
} from "@/components/ui/primitives";
import type { TopupRequestView } from "@/lib/models/topup-request";
import { formatTaiwanDateTime } from "@/lib/date";
import {
  approveTopupAction,
  rejectTopupAction,
  deleteTopupAction,
  bulkApproveTopupsAction,
  bulkRejectTopupsAction,
  bulkDeleteTopupsAction,
} from "@/app/(app)/admin/topups/actions";

const st = {
  pending: { label: "待審核", tone: "warning" as const },
  approved: { label: "已核准", tone: "positive" as const },
  rejected: { label: "已退件", tone: "danger" as const },
};

type Tab = "all" | "pending" | "approved" | "rejected";

export function TopupsTables({ requests }: { requests: TopupRequestView[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("pending");
  const [allPage, setAllPage] = useState(1);
  const [pPage, setPPage] = useState(1);
  const [aPage, setAPage] = useState(1);
  const [rPage, setRPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const pending = requests.filter((r) => r.status === "pending");
  const approved = requests.filter((r) => r.status === "approved");
  const rejected = requests.filter((r) => r.status === "rejected");
  // "全部" 包含三種狀態全部的申請；選其他頁籤才會篩選成特定狀態。
  const all = [...requests].sort((a, b) => b.at.getTime() - a.at.getTime());

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "all", label: "全部", count: all.length },
    { key: "pending", label: "待審核", count: pending.length },
    { key: "approved", label: "已核准", count: approved.length },
    { key: "rejected", label: "已退件", count: rejected.length },
  ];

  const byTab = {
    all: { data: all, page: allPage, setPage: setAllPage },
    pending: { data: pending, page: pPage, setPage: setPPage },
    approved: { data: approved, page: aPage, setPage: setAPage },
    rejected: { data: rejected, page: rPage, setPage: setRPage },
  };
  const { data, page, setPage } = byTab[tab];
  const { pageCount, current, pageRows: rows, effectiveSize } = paginate(data, page, pageSize);

  function changeTab(next: Tab) {
    setTab(next);
    setSelected(new Set());
  }

  const changeSize = (n: number) => {
    setPageSize(n);
    setAllPage(1);
    setPPage(1);
    setAPage(1);
    setRPage(1);
    setSelected(new Set());
  };

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

  // 全選（例如「全部」頁籤）常會混到已處理的申請；核准／退件只要選取範圍裡「還有」
  // 待審核的就顯示，實際送出時只挑待審核的那幾筆處理，已處理的不會被誤動。
  const selectedPendingIds = requests.filter((r) => selected.has(r.id) && r.status === "pending").map((r) => r.id);
  const canBulkReview = selectedPendingIds.length > 0;

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

  async function bulkApprove() {
    setBulkBusy(true);
    setError(undefined);
    const result = await bulkApproveTopupsAction(selectedPendingIds);
    if (result.error) setError(result.error);
    setSelected(new Set());
    setBulkBusy(false);
    router.refresh();
  }

  async function bulkReject() {
    setBulkBusy(true);
    setError(undefined);
    const result = await bulkRejectTopupsAction(selectedPendingIds);
    if (result.error) setError(result.error);
    setSelected(new Set());
    setBulkBusy(false);
    router.refresh();
  }

  async function bulkDelete() {
    setBulkBusy(true);
    setError(undefined);
    const result = await bulkDeleteTopupsAction([...selected]);
    if (result.error) setError(result.error);
    setSelected(new Set());
    setBulkBusy(false);
    router.refresh();
  }

  return (
    <Section>
      <ListToolbar tabs={{ tabs, value: tab, onChange: changeTab }} pageSize={pageSize} onPageSizeChange={changeSize} />

      {error && <p className="text-[13px] lg:text-[14px] text-danger">{error}</p>}

      <BulkActionBar
        count={selected.size}
        unit="筆"
        onCancel={() => setSelected(new Set())}
        actions={[
          ...(canBulkReview
            ? [
                {
                  label: `核准選取${selectedPendingIds.length < selected.size ? `（${selectedPendingIds.length} 筆待審核）` : ""}`,
                  tone: "neutral" as const,
                  onClick: bulkApprove,
                  disabled: bulkBusy,
                },
                {
                  label: `退件選取${selectedPendingIds.length < selected.size ? `（${selectedPendingIds.length} 筆待審核）` : ""}`,
                  tone: "danger" as const,
                  onClick: bulkReject,
                  disabled: bulkBusy,
                },
              ]
            : []),
          { label: "刪除選取", tone: "danger", onClick: bulkDelete, disabled: bulkBusy },
        ]}
      />

      <TableWrap>
        <thead>
          <tr>
            <Th className="w-10">
              <input type="checkbox" checked={pageAllSelected} onChange={togglePageAll} aria-label="選取本頁全部" />
            </Th>
            <Th>申請人</Th>
            <Th>部門</Th>
            <Th className="text-right">金額</Th>
            <Th>方式</Th>
            <Th>時間</Th>
            <Th>狀態</Th>
            <Th className="text-right">操作</Th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <Td colSpan={8} className="text-center text-muted">
                目前沒有資料
              </Td>
            </tr>
          ) : (
            rows.map((req) => (
              <tr key={req.id} className={selected.has(req.id) ? "bg-brand-soft" : ""}>
                <Td>
                  <input
                    type="checkbox"
                    checked={selected.has(req.id)}
                    onChange={() => toggleOne(req.id)}
                    aria-label={`選取 ${req.memberName}`}
                  />
                </Td>
                <Td>{req.memberName}</Td>
                <Td className="text-muted">{req.dept}</Td>
                <Td className="text-right tabular-nums">NT$ {req.amount}</Td>
                <Td>{req.method}</Td>
                <Td className="text-muted">{formatTaiwanDateTime(req.at)}</Td>
                <Td>
                  <Badge tone={st[req.status].tone}>{st[req.status].label}</Badge>
                </Td>
                <Td className="text-right">
                  <div className="flex justify-end gap-2">
                    {req.status === "pending" && (
                      <>
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
                      </>
                    )}
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={busyId === req.id}
                      onClick={() => remove(req.id)}
                    >
                      刪除
                    </Button>
                  </div>
                </Td>
              </tr>
            ))
          )}
        </tbody>
      </TableWrap>
      <Pagination page={current} pageCount={pageCount} total={data.length} pageSize={effectiveSize} onPage={setPage} unit="筆" />
    </Section>
  );
}
