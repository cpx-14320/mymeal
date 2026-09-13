"use client";

import { useState } from "react";
import {
  Section,
  Stat,
  Button,
  PillTabs,
  TableWrap,
  Th,
  Td,
} from "@/components/ui/primitives";

const daily = [
  { date: "09/08（一）", orders: 9, amount: 860 },
  { date: "09/09（二）", orders: 12, amount: 1090 },
  { date: "09/10（三）", orders: 11, amount: 1050 },
  { date: "09/11（四）", orders: 6, amount: 540 },
  { date: "09/12（五）", orders: 0, amount: 0 },
];

const byKind = [
  { name: "便當", sessions: 4, count: 38, amount: 3540 },
  { name: "飲料", sessions: 2, count: 14, amount: 1180 },
  { name: "下午茶", sessions: 1, count: 6, amount: 300 },
];

const bySupplier = [
  { name: "福來鮮食", orders: 18, amount: 1660 },
  { name: "阿明快餐", orders: 12, amount: 1130 },
  { name: "健康廚房", orders: 8, amount: 750 },
  { name: "星巴克 三多店", orders: 14, amount: 1180 },
];

const RANGE_OPTIONS = [7, 14, 30] as const;
type Range = (typeof RANGE_OPTIONS)[number];

export function ReportsView() {
  const [range, setRange] = useState<Range>(7);

  const rangeDaily = daily.slice(-range);
  const maxOrders = Math.max(...rangeDaily.map((d) => d.orders), 0);
  const totalOrders = rangeDaily.reduce((sum, d) => sum + d.orders, 0);
  const totalAmount = rangeDaily.reduce((sum, d) => sum + d.amount, 0);
  const avgTicket = totalOrders ? Math.round(totalAmount / totalOrders) : 0;

  return (
    <div className="space-y-8">
      <Section
        title="訂單與金流報表"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <PillTabs
              tabs={RANGE_OPTIONS.map((n) => ({
                key: String(n),
                label: `近 ${n} 天`,
              }))}
              value={String(range)}
              onChange={(key) => setRange(Number(key) as Range)}
            />
            <Button variant="secondary">匯出 CSV</Button>
          </div>
        }
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label={`近 ${range} 天訂單數`} value={totalOrders} />
          <Stat label={`近 ${range} 天金額`} value={`NT$ ${totalAmount}`} />
          <Stat label="平均客單價" value={`NT$ ${avgTicket}`} />
        </div>
      </Section>

      <Section title="每日訂單數">
        <div className="space-y-2 rounded-xl border border-line bg-surface p-5">
          {rangeDaily.map((d) => (
            <div key={d.date} className="flex items-center gap-3 text-sm">
              <span className="w-24 shrink-0 text-muted">{d.date}</span>
              <div className="h-4 flex-1 overflow-hidden rounded bg-surface-2">
                <div
                  className="h-full rounded bg-brand"
                  style={{ width: `${maxOrders ? (d.orders / maxOrders) * 100 : 0}%` }}
                />
              </div>
              <span className="w-16 shrink-0 text-right tabular-nums">
                {d.orders} 份
              </span>
              <span className="w-24 shrink-0 text-right tabular-nums text-muted">
                NT$ {d.amount}
              </span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="依類型統計">
        <TableWrap>
          <thead>
            <tr>
              <Th>類型</Th>
              <Th className="text-right">場次</Th>
              <Th className="text-right">份數 / 杯數</Th>
              <Th className="text-right">金額</Th>
            </tr>
          </thead>
          <tbody>
            {byKind.map((r) => (
              <tr key={r.name}>
                <Td className="font-medium">{r.name}</Td>
                <Td className="text-right tabular-nums">{r.sessions}</Td>
                <Td className="text-right tabular-nums">{r.count}</Td>
                <Td className="text-right tabular-nums">NT$ {r.amount}</Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Section>

      <Section title="依店家統計">
        <TableWrap>
          <thead>
            <tr>
              <Th>店家</Th>
              <Th className="text-right">份數 / 杯數</Th>
              <Th className="text-right">金額</Th>
            </tr>
          </thead>
          <tbody>
            {bySupplier.map((r) => (
              <tr key={r.name}>
                <Td className="font-medium">{r.name}</Td>
                <Td className="text-right tabular-nums">{r.orders}</Td>
                <Td className="text-right tabular-nums">NT$ {r.amount}</Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Section>

      <p className="text-xs text-muted">＊此頁為介面預覽，資料為範例。</p>
    </div>
  );
}
