"use client";

import { useState } from "react";
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

const names = [
  "王建豪", "陳怡君", "張家瑋", "林佩珊", "黃志明", "李冠廷", "吳雅婷", "蔡孟儒",
  "鄭凱文", "許家豪", "周宜蓁", "謝旻軒", "洪世昌", "江佩蓉", "曾柏翰", "邱瑋倫",
  "賴品妍", "蕭子涵", "羅偉誠", "高鈺婷",
];
const depts = [
  "設計部", "行政部", "業務部", "網路發展部", "資訊部", "客服部", "財務部", "人資部",
];
const methods = ["現金", "銀行轉帳", "信用卡"];

function timestamp(day: number, hour: number, minute: number, second: number) {
  return `2026/09/${String(day).padStart(2, "0")} ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}`;
}

const pending = Array.from({ length: 24 }, (_, i) => {
  const method = methods[i % methods.length];
  return {
    who: names[i % names.length],
    dept: depts[i % depts.length],
    amount: [100, 300, 500, 1000, 2000][i % 5],
    method,
    code: method === "銀行轉帳" ? String(10000 + i * 137).slice(-5) : "—",
    at: timestamp(10 - (i % 6), 8 + (i % 9), (i * 7) % 60, (i * 17) % 60),
  };
});

const processedAll = Array.from({ length: 28 }, (_, i) => ({
  who: names[(i + 3) % names.length],
  dept: depts[(i + 5) % depts.length],
  amount: [200, 500, 800, 1000, 1500][i % 5],
  method: methods[i % methods.length],
  at: timestamp(9 - (i % 8), 9 + (i % 8), (i * 11) % 60, (i * 23) % 60),
  status: (i % 4 === 0 ? "rejected" : "approved") as "approved" | "rejected",
}));

const approved = processedAll.filter((r) => r.status === "approved");
const rejected = processedAll.filter((r) => r.status === "rejected");

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

export function TopupsTables() {
  const [tab, setTab] = useState<Tab>("pending");
  const [pPage, setPPage] = useState(1);
  const [aPage, setAPage] = useState(1);
  const [rPage, setRPage] = useState(1);
  const [allPage, setAllPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

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

  return (
    <Section title="儲值審核" description={tabDescription[tab]}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <PillTabs tabs={tabs} value={tab} onChange={setTab} />
        <PageSizeSelect value={pageSize} onChange={changeSize} />
      </div>

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
              {p.rows.map((r, i) => (
                <tr key={i}>
                  <Td className="font-medium">{r.who}</Td>
                  <Td className="text-muted">{r.dept}</Td>
                  <Td className="text-right tabular-nums">NT$ {r.amount}</Td>
                  <Td>{r.method}</Td>
                  <Td className="tabular-nums text-muted">{r.code}</Td>
                  <Td className="whitespace-nowrap text-muted">{r.at}</Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm">核准</Button>
                      <Button variant="danger" size="sm">
                        退件
                      </Button>
                    </div>
                  </Td>
                </tr>
              ))}
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
              {processedTabs[tab].rows.map((r, i) => (
                <tr key={i}>
                  <Td className="font-medium">{r.who}</Td>
                  <Td className="text-muted">{r.dept}</Td>
                  <Td className="text-right tabular-nums">NT$ {r.amount}</Td>
                  <Td>{r.method}</Td>
                  <Td className="whitespace-nowrap text-muted">{r.at}</Td>
                  {tab === "all" && (
                    <Td>
                      <Badge tone={st[r.status].tone}>{st[r.status].label}</Badge>
                    </Td>
                  )}
                </tr>
              ))}
            </tbody>
          </TableWrap>
          <Pagination
            page={processedTabs[tab].current}
            pageCount={processedTabs[tab].pageCount}
            total={
              tab === "approved"
                ? approved.length
                : tab === "rejected"
                  ? rejected.length
                  : processedAll.length
            }
            pageSize={pageSize}
            onPage={
              tab === "approved" ? setAPage : tab === "rejected" ? setRPage : setAllPage
            }
          />
        </>
      )}
    </Section>
  );
}
