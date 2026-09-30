"use client";

import { useState } from "react";
import { Section, Stat, Button, PillTabs } from "@/components/ui/primitives";
import type { DailyOrderStat } from "@/lib/models/reports";

const RANGE_OPTIONS = [7, 14, 30] as const;
type Range = (typeof RANGE_OPTIONS)[number];

/** 團訂狀況頁最上方的訂單與金流報表——原本是獨立的「報表」頁，併進來當這頁的
 *  摘要區塊，放在清單分頁 tabs 上方。「依頁面統計」區塊沒有人在用，併入時拿掉了。 */
export function GroupOrderStats({ daily }: { daily: DailyOrderStat[] }) {
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
    </div>
  );
}
