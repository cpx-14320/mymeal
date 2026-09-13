"use client";

import { useState } from "react";
import {
  Badge,
  TableWrap,
  Th,
  Td,
  Pagination,
  PageSizeSelect,
} from "@/components/ui/primitives";

const actors = ["finance", "catering", "support", "super", "hr"];
const entries = [
  { action: "核准儲值申請", target: "topup #%", risk: false },
  { action: "退件儲值申請", target: "topup #%", risk: false },
  { action: "編輯模板", target: "標準便當週 / 星期%", risk: false },
  { action: "發佈訂餐專區", target: "zone #%", risk: false },
  { action: "手動退款 NT$95", target: "user #% / 團訂 #%", risk: true },
  { action: "手動加值 NT$500", target: "user #%", risk: true },
  { action: "指派角色 財務管理員", target: "user #%", risk: true },
  { action: "停權會員", target: "user #%", risk: true },
  { action: "復權會員", target: "user #%", risk: true },
  { action: "結算團訂", target: "團訂 #%", risk: false },
  { action: "編輯品項", target: "item #%", risk: false },
  { action: "修改系統設定", target: "截止規則", risk: true },
];

const logs = Array.from({ length: 32 }, (_, i) => {
  const e = entries[i % entries.length];
  return {
    at: `09/${10 - (i % 9)} ${String(8 + (i % 11)).padStart(2, "0")}:${String((i * 7) % 60).padStart(2, "0")}`,
    who: actors[i % actors.length],
    action: e.action,
    target: e.target.replace(/%/g, () => String(1000 + i)),
    risk: e.risk,
  };
});

export function AuditTable() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const pageCount = Math.max(1, Math.ceil(logs.length / pageSize));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * pageSize;
  const rows = logs.slice(start, start + pageSize);

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <PageSizeSelect
          value={pageSize}
          onChange={(n) => {
            setPageSize(n);
            setPage(1);
          }}
        />
      </div>

      <TableWrap>
        <thead>
          <tr>
            <Th>時間</Th>
            <Th>操作者</Th>
            <Th>動作</Th>
            <Th>對象</Th>
            <Th>類別</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((l, i) => (
            <tr key={i}>
              <Td className="whitespace-nowrap text-muted">{l.at}</Td>
              <Td className="font-mono text-xs">{l.who}</Td>
              <Td>{l.action}</Td>
              <Td className="font-mono text-xs text-muted">{l.target}</Td>
              <Td>
                <Badge tone={l.risk ? "danger" : "neutral"}>
                  {l.risk ? "高風險" : "一般"}
                </Badge>
              </Td>
            </tr>
          ))}
        </tbody>
      </TableWrap>

      <Pagination
        page={current}
        pageCount={pageCount}
        total={logs.length}
        pageSize={pageSize}
        onPage={setPage}
        unit="筆"
      />

      <p className="text-xs text-muted">＊此頁為介面預覽，資料為範例。</p>
    </div>
  );
}
