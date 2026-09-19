"use client";

import { useMemo, useState } from "react";
import { PillTabs, PageSizeSelect, Pagination, TableWrap, Th, Td } from "@/components/ui/primitives";
import { formatTaiwanDateTime } from "@/lib/date";
import type { WalletLedgerRow, LedgerType } from "@/lib/models/wallet";
import type { TopupRequestView } from "@/lib/models/topup-request";

const ledgerTypeLabel: Record<LedgerType, string> = {
  topup: "儲值入帳",
  spend: "訂餐扣款",
  refund: "退款",
  adjustment: "手動調整",
};

function paginate<T>(rows: T[], page: number, size: number) {
  const pageCount = Math.max(1, Math.ceil(rows.length / size));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * size;
  return { pageCount, current, rows: rows.slice(start, start + size) };
}

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

type Tab = "txns" | "pending" | "approved" | "rejected";

export function WalletTabs({
  ledger,
  requests,
}: {
  ledger: WalletLedgerRow[];
  requests: TopupRequestView[];
}) {
  const [tab, setTab] = useState<Tab>("txns");
  const [year, setYear] = useState<number | "all">("all");
  const [month, setMonth] = useState<number | "all">("all");
  const [pageSize, setPageSize] = useState(25);
  const [txnsPage, setTxnsPage] = useState(1);
  const [pendingPage, setPendingPage] = useState(1);
  const [approvedPage, setApprovedPage] = useState(1);
  const [rejectedPage, setRejectedPage] = useState(1);

  const years = useMemo(() => {
    const all = [...ledger.map((l) => l.at), ...requests.map((r) => r.at)].map((d) => d.getFullYear());
    return [...new Set(all)].sort((a, b) => b - a);
  }, [ledger, requests]);

  const matchesYearMonth = (d: Date) =>
    (year === "all" || d.getFullYear() === year) && (month === "all" || d.getMonth() + 1 === month);

  const filteredLedger = ledger.filter((l) => matchesYearMonth(l.at));
  const pending = requests.filter((r) => r.status === "pending" && matchesYearMonth(r.at));
  const approved = requests.filter((r) => r.status === "approved" && matchesYearMonth(r.at));
  const rejected = requests.filter((r) => r.status === "rejected" && matchesYearMonth(r.at));

  const t = paginate(filteredLedger, txnsPage, pageSize);
  const p = paginate(pending, pendingPage, pageSize);
  const a = paginate(approved, approvedPage, pageSize);
  const r = paginate(rejected, rejectedPage, pageSize);

  const resetPages = () => {
    setTxnsPage(1);
    setPendingPage(1);
    setApprovedPage(1);
    setRejectedPage(1);
  };

  const changeSize = (n: number) => {
    setPageSize(n);
    resetPages();
  };

  const tabs = [
    { key: "txns" as Tab, label: "交易明細", count: filteredLedger.length },
    { key: "pending" as Tab, label: "待審核", count: pending.length },
    { key: "approved" as Tab, label: "已核准", count: approved.length },
    { key: "rejected" as Tab, label: "已退件", count: rejected.length },
  ];

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PillTabs tabs={tabs} value={tab} onChange={setTab} />

        <div className="flex items-center gap-2 text-xs text-muted">
          <PageSizeSelect value={pageSize} onChange={changeSize} />
          <select
            value={year}
            onChange={(e) => {
              setYear(e.target.value === "all" ? "all" : Number(e.target.value));
              resetPages();
            }}
            className="rounded-lg border border-line bg-surface px-2 py-1 text-xs text-ink outline-none focus:border-brand"
            aria-label="篩選年份"
          >
            <option value="all">全部年份</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <select
            value={month}
            onChange={(e) => {
              setMonth(e.target.value === "all" ? "all" : Number(e.target.value));
              resetPages();
            }}
            className="rounded-lg border border-line bg-surface px-2 py-1 text-xs text-ink outline-none focus:border-brand"
            aria-label="篩選月份"
          >
            <option value="all">全部月份</option>
            {MONTHS.map((m) => (
              <option key={m} value={m}>
                {m} 月
              </option>
            ))}
          </select>
        </div>
      </div>

      {tab === "txns" && (
        <>
          <TableWrap>
            <thead>
              <tr>
                <Th>時間</Th>
                <Th>類型</Th>
                <Th>說明</Th>
                <Th className="text-right">金額</Th>
                <Th className="text-right">餘額</Th>
              </tr>
            </thead>
            <tbody>
              {t.rows.map((tx) => (
                <tr key={tx.id}>
                  <Td className="whitespace-nowrap text-muted">{formatTaiwanDateTime(tx.at)}</Td>
                  <Td>{ledgerTypeLabel[tx.type]}</Td>
                  <Td className="text-muted">{tx.detail}</Td>
                  <Td className={`text-right tabular-nums ${tx.amount > 0 ? "text-positive" : ""}`}>
                    {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                  </Td>
                  <Td className="text-right tabular-nums">{tx.balanceAfter}</Td>
                </tr>
              ))}
              {t.rows.length === 0 && (
                <tr>
                  <Td colSpan={5} className="text-center text-muted">
                    這個範圍內還沒有任何交易紀錄。
                  </Td>
                </tr>
              )}
            </tbody>
          </TableWrap>
          <Pagination
            page={t.current}
            pageCount={t.pageCount}
            total={filteredLedger.length}
            pageSize={pageSize}
            onPage={setTxnsPage}
            unit="筆"
          />
        </>
      )}

      {(tab === "pending" || tab === "approved" || tab === "rejected") && (
        <>
          <TableWrap>
            <thead>
              <tr>
                <Th>日期</Th>
                <Th className="text-right">金額</Th>
                <Th>方式</Th>
              </tr>
            </thead>
            <tbody>
              {(tab === "pending" ? p : tab === "approved" ? a : r).rows.map((req) => (
                <tr key={req.id}>
                  <Td className="whitespace-nowrap text-muted">{formatTaiwanDateTime(req.at)}</Td>
                  <Td className="text-right tabular-nums">NT$ {req.amount}</Td>
                  <Td>{req.method}</Td>
                </tr>
              ))}
              {(tab === "pending" ? p : tab === "approved" ? a : r).rows.length === 0 && (
                <tr>
                  <Td colSpan={3} className="text-center text-muted">
                    這個範圍內沒有資料。
                  </Td>
                </tr>
              )}
            </tbody>
          </TableWrap>
          <Pagination
            page={(tab === "pending" ? p : tab === "approved" ? a : r).current}
            pageCount={(tab === "pending" ? p : tab === "approved" ? a : r).pageCount}
            total={tab === "pending" ? pending.length : tab === "approved" ? approved.length : rejected.length}
            pageSize={pageSize}
            onPage={tab === "pending" ? setPendingPage : tab === "approved" ? setApprovedPage : setRejectedPage}
            unit="筆"
          />
        </>
      )}
    </section>
  );
}
