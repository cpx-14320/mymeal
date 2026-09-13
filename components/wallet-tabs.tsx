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

const txnTypes = ["訂餐扣款", "儲值入帳", "退款"] as const;
const txnDescs = [
  "五樓午餐．香煎鯖魚便當",
  "行政週五團．三杯雞便當",
  "三樓週三團．烤時蔬溫沙拉",
  "銀行轉帳．末五碼 12345",
  "三樓週三團取消",
  "研發部午餐．招牌雞腿飯",
  "星巴克揪團．拿鐵（大）",
];

function timestamp(day: number, hour: number, minute: number) {
  return `2026/09/${String(day).padStart(2, "0")} ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

let runningBalance = 415;
const txns = Array.from({ length: 30 }, (_, i) => {
  const type = txnTypes[i % txnTypes.length];
  const amount =
    type === "儲值入帳" ? [300, 500, 1000][i % 3] : type === "退款" ? 95 : -[90, 95, 100][i % 3];
  runningBalance -= amount;
  return {
    date: timestamp(10 - (i % 9), 9 + (i % 10), (i * 7) % 60),
    type,
    desc: txnDescs[i % txnDescs.length],
    amount,
    balance: runningBalance,
  };
}).reverse();

const requestMethods = ["銀行轉帳", "現金", "信用卡"];
const requestStatuses = ["approved", "approved", "pending", "rejected"] as const;

const requests = Array.from({ length: 14 }, (_, i) => ({
  date: `2026/09/${String(10 - (i % 9)).padStart(2, "0")} ${String(9 + (i % 12)).padStart(2, "0")}:${String((i * 11) % 60).padStart(2, "0")}:${String((i * 19) % 60).padStart(2, "0")}`,
  amount: [300, 500, 1000, 1500][i % 4],
  method: requestMethods[i % requestMethods.length],
  status: requestStatuses[i % requestStatuses.length],
}));

const reqStatus = {
  approved: { label: "已核准", tone: "positive" as const },
  pending: { label: "待審核", tone: "warning" as const },
  rejected: { label: "已退件", tone: "danger" as const },
};

function paginate<T>(rows: T[], page: number, size: number) {
  const pageCount = Math.max(1, Math.ceil(rows.length / size));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * size;
  return { pageCount, current, rows: rows.slice(start, start + size) };
}

type Tab = "txns" | "requests";

export function WalletTabs() {
  const [tab, setTab] = useState<Tab>("txns");
  const [pageSize, setPageSize] = useState(10);
  const [txnsPage, setTxnsPage] = useState(1);
  const [requestsPage, setRequestsPage] = useState(1);

  const t = paginate(txns, txnsPage, pageSize);
  const r = paginate(requests, requestsPage, pageSize);

  const changeSize = (n: number) => {
    setPageSize(n);
    setTxnsPage(1);
    setRequestsPage(1);
  };

  const tabs = [
    { key: "txns" as Tab, label: "交易明細", count: txns.length },
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
              {t.rows.map((tx, i) => (
                <tr key={i}>
                  <Td className="whitespace-nowrap text-muted">{tx.date}</Td>
                  <Td>{tx.type}</Td>
                  <Td className="text-muted">{tx.desc}</Td>
                  <Td
                    className={`text-right tabular-nums ${
                      tx.amount > 0 ? "text-positive" : ""
                    }`}
                  >
                    {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                  </Td>
                  <Td className="text-right tabular-nums">{tx.balance}</Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
          <Pagination
            page={t.current}
            pageCount={t.pageCount}
            total={txns.length}
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
              {r.rows.map((req, i) => (
                <tr key={i}>
                  <Td className="whitespace-nowrap text-muted">{req.date}</Td>
                  <Td className="text-right tabular-nums">
                    NT$ {req.amount}
                  </Td>
                  <Td>{req.method}</Td>
                  <Td>
                    <Badge tone={reqStatus[req.status].tone}>
                      {reqStatus[req.status].label}
                    </Badge>
                  </Td>
                </tr>
              ))}
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
