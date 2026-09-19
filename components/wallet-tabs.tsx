"use client";

import { useState } from "react";
import {
  PillTabs,
  PageSizeSelect,
  Pagination,
  Badge,
  TableWrap,
  Th,
  Td,
} from "@/components/ui/primitives";
import { formatTaiwanDateTime } from "@/lib/date";
import type { WalletLedgerRow, LedgerType } from "@/lib/models/wallet";
import type { TopupRequestView, TopupStatus } from "@/lib/models/topup-request";

const ledgerTypeLabel: Record<LedgerType, string> = {
  topup: "儲值入帳",
  spend: "訂餐扣款",
  refund: "退款",
  adjustment: "手動調整",
};

const reqStatus: Record<TopupStatus, { label: string; tone: "positive" | "warning" | "danger" }> = {
  approved: { label: "已核准", tone: "positive" },
  pending: { label: "待審核", tone: "warning" },
  rejected: { label: "已退件", tone: "danger" },
};

function paginate<T>(rows: T[], page: number, size: number) {
  const pageCount = Math.max(1, Math.ceil(rows.length / size));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * size;
  return { pageCount, current, rows: rows.slice(start, start + size) };
}

type Tab = "txns" | "requests";

export function WalletTabs({
  ledger,
  requests,
}: {
  ledger: WalletLedgerRow[];
  requests: TopupRequestView[];
}) {
  const [tab, setTab] = useState<Tab>("txns");
  const [pageSize, setPageSize] = useState(10);
  const [txnsPage, setTxnsPage] = useState(1);
  const [requestsPage, setRequestsPage] = useState(1);

  const t = paginate(ledger, txnsPage, pageSize);
  const r = paginate(requests, requestsPage, pageSize);

  const changeSize = (n: number) => {
    setPageSize(n);
    setTxnsPage(1);
    setRequestsPage(1);
  };

  const tabs = [
    { key: "txns" as Tab, label: "交易明細", count: ledger.length },
    { key: "requests" as Tab, label: "儲值申請進度", count: requests.length },
  ];

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PillTabs tabs={tabs} value={tab} onChange={setTab} />
        <PageSizeSelect value={pageSize} onChange={changeSize} />
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
                    還沒有任何交易紀錄。
                  </Td>
                </tr>
              )}
            </tbody>
          </TableWrap>
          <Pagination
            page={t.current}
            pageCount={t.pageCount}
            total={ledger.length}
            pageSize={pageSize}
            onPage={setTxnsPage}
            unit="筆"
          />
        </>
      )}

      {tab === "requests" && (
        <>
          <TableWrap>
            <thead>
              <tr>
                <Th>日期</Th>
                <Th className="text-right">金額</Th>
                <Th>方式</Th>
                <Th>狀態</Th>
              </tr>
            </thead>
            <tbody>
              {r.rows.map((req) => (
                <tr key={req.id}>
                  <Td className="whitespace-nowrap text-muted">{formatTaiwanDateTime(req.at)}</Td>
                  <Td className="text-right tabular-nums">NT$ {req.amount}</Td>
                  <Td>{req.method}</Td>
                  <Td>
                    <Badge tone={reqStatus[req.status].tone}>{reqStatus[req.status].label}</Badge>
                  </Td>
                </tr>
              ))}
              {r.rows.length === 0 && (
                <tr>
                  <Td colSpan={4} className="text-center text-muted">
                    還沒有任何儲值申請。
                  </Td>
                </tr>
              )}
            </tbody>
          </TableWrap>
          <Pagination
            page={r.current}
            pageCount={r.pageCount}
            total={requests.length}
            pageSize={pageSize}
            onPage={setRequestsPage}
            unit="筆"
          />
        </>
      )}
    </section>
  );
}
