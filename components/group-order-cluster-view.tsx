"use client";

import { useState } from "react";
import {
  Card,
  CardBody,
  Stat,
  Button,
  ButtonLink,
  TableWrap,
  Th,
  Td,
} from "@/components/ui/primitives";
import {
  groupOrderTotals,
  unitById,
  departmentById,
  riceLevelLabel,
  summarizeOrderLines,
  type GroupOrder,
} from "@/lib/mock";
import { downloadCsv } from "@/lib/csv-export";

export function GroupOrderClusterView({
  orders,
  templateName,
  date,
}: {
  orders: GroupOrder[];
  templateName: string;
  date: string;
}) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(orders.map((o) => o.unitId)),
  );

  const toggleUnit = (unitId: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(unitId)) next.delete(unitId);
      else next.add(unitId);
      return next;
    });

  const allSelected = selected.size === orders.length;
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(orders.map((o) => o.unitId)));

  const [paidMembers, setPaidMembers] = useState<Set<string>>(() => new Set());
  const paidKey = (orderId: string, memberId: string) => `${orderId}-${memberId}`;
  const togglePaid = (key: string) =>
    setPaidMembers((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  // 同一個人在同一團裡的多筆餐點合併成一列（rowSpan），付款狀態也是以「人」為單位標記
  const memberGroupsByOrder = (o: GroupOrder) => {
    const groups: { memberId: string; memberName: string; lines: GroupOrder["lines"] }[] = [];
    for (const l of o.lines) {
      const last = groups[groups.length - 1];
      if (last && last.memberId === l.memberId) last.lines.push(l);
      else groups.push({ memberId: l.memberId, memberName: l.memberName, lines: [l] });
    }
    return groups;
  };

  const selectedOrders = orders.filter((o) => selected.has(o.unitId));
  const combinedTotals = selectedOrders.reduce(
    (acc, o) => {
      const t = groupOrderTotals(o);
      return { qty: acc.qty + t.qty, amount: acc.amount + t.amount };
    },
    { qty: 0, amount: 0 },
  );
  const selectedMemberKeys = selectedOrders.flatMap((o) =>
    memberGroupsByOrder(o).map((g) => paidKey(o.id, g.memberId)),
  );
  const paidCount = selectedMemberKeys.filter((k) => paidMembers.has(k)).length;

  const buildUnitBlock = (o: GroupOrder): (string | number)[][] => {
    const summary = summarizeOrderLines(o.lines);
    const totalQty = summary.reduce((sum, s) => sum + s.totalQty, 0);
    return [
      [o.host],
      ["餐點", "飯量", "數量"],
      ...summary.map((s) => [s.itemName, s.riceBreakdown, s.totalQty]),
      ["合計", "", totalQty],
    ];
  };

  const handleExport = () => {
    const blocks = selectedOrders.map(buildUnitBlock);
    const allRows = blocks.flatMap((block, i) => (i === 0 ? block : [[], [], ...block]));
    const [firstRow, ...restRows] = allRows;
    downloadCsv(`${templateName}_${date}_單位彙總.csv`, firstRow, restRows);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="開團單位數" value={`${orders.length} 個`} />
        <Stat
          label="已選單位份數"
          value={`${combinedTotals.qty} 份`}
          hint={`NT$ ${combinedTotals.amount}`}
        />
        <Stat
          label="已付款"
          value={`${paidCount} / ${selectedMemberKeys.length} 人`}
          hint="點下方人名前的圖示切換"
        />
        <Stat label="模板／日期" value={templateName} hint={date} />
      </div>

      <Card>
        <CardBody className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight">選擇要匯出的單位</h2>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={allSelected} onChange={toggleAll} />
              全部單位
            </label>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {orders.map((o) => {
              const unit = unitById(o.unitId);
              const dept = unit ? departmentById(unit.departmentId) : undefined;
              const totals = groupOrderTotals(o);
              return (
                <label
                  key={o.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2 text-sm"
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selected.has(o.unitId)}
                      onChange={() => toggleUnit(o.unitId)}
                    />
                    {dept?.name} {unit?.name}
                  </span>
                  <span className="tabular-nums text-muted">
                    {totals.qty} 份．NT$ {totals.amount}
                  </span>
                </label>
              );
            })}
          </div>
          <div className="flex justify-end">
            <Button disabled={selected.size === 0} onClick={handleExport}>
              匯出選取單位（{selected.size}）
            </Button>
          </div>
        </CardBody>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold tracking-tight">合併訂購明細</h2>
          <p className="text-xs text-muted">
            <span className="text-positive">✓</span> 已付款．
            <span className="text-muted">○</span> 未付款．點人名前的圖示切換
          </p>
        </div>
        <TableWrap>
          <thead>
            <tr>
              <Th>單位</Th>
              <Th>同事</Th>
              <Th>餐點</Th>
              <Th className="text-center">飯量</Th>
              <Th className="text-center">數量</Th>
              <Th>備註</Th>
              <Th className="text-right">小計</Th>
            </tr>
          </thead>
          <tbody>
            {selectedOrders.length === 0 ? (
              <tr>
                <Td colSpan={7} className="text-center text-muted">
                  尚未選擇任何單位。
                </Td>
              </tr>
            ) : (
              selectedOrders.flatMap((o) => {
                const unit = unitById(o.unitId);
                const memberGroups = memberGroupsByOrder(o);
                return memberGroups.flatMap((mg, mgIndex) =>
                  mg.lines.map((l, li) => {
                    const key = paidKey(o.id, mg.memberId);
                    const paid = paidMembers.has(key);
                    return (
                      <tr key={`${o.id}-${mg.memberId}-${li}`}>
                        {mgIndex === 0 && li === 0 && (
                          <Td rowSpan={o.lines.length} className="align-middle">
                            {unit?.name}
                          </Td>
                        )}
                        {li === 0 && (
                          <Td rowSpan={mg.lines.length} className="align-middle">
                            <button
                              type="button"
                              onClick={() => togglePaid(key)}
                              aria-label={paid ? "標記為未付款" : "標記為已付款"}
                              className={`mr-1.5 ${
                                paid ? "text-positive" : "text-muted hover:text-ink"
                              }`}
                            >
                              {paid ? "✓" : "○"}
                            </button>
                            {mg.memberName === o.host
                              ? `${mg.memberName}（團主）`
                              : mg.memberName}
                          </Td>
                        )}
                        <Td>{l.itemName}</Td>
                        <Td className="text-center">{riceLevelLabel[l.rice]}</Td>
                        <Td className="text-center tabular-nums">{l.qty}</Td>
                        <Td className="text-muted">{l.note || "—"}</Td>
                        <Td className="text-right tabular-nums">
                          NT$ {l.price * l.qty}
                        </Td>
                      </tr>
                    );
                  }),
                );
              })
            )}
            <tr>
              <Td className="font-semibold">合計</Td>
              <Td />
              <Td />
              <Td />
              <Td className="text-center font-semibold tabular-nums">
                {combinedTotals.qty}
              </Td>
              <Td />
              <Td className="text-right font-semibold tabular-nums">
                NT$ {combinedTotals.amount}
              </Td>
            </tr>
          </tbody>
        </TableWrap>
      </div>

      <div className="flex justify-end">
        <ButtonLink href="/group-orders" variant="ghost">
          返回列表
        </ButtonLink>
      </div>
    </div>
  );
}
