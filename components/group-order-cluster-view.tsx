"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardBody,
  Stat,
  Button,
  ButtonLink,
  TableWrap,
  Th,
  Td,
  Field,
  inputClass,
} from "@/components/ui/primitives";
import { Modal, ModalHeader } from "@/components/ui/modal";
import { riceLevelLabel, summarizeOrderLines } from "@/lib/mock";
import type { GroupOrderDetail } from "@/lib/models/group-order";
import { downloadCsv } from "@/lib/csv-export";
import { setMemberPaidAction } from "@/app/(app)/group-orders/cluster/actions";

export function GroupOrderClusterView({
  orders,
  templateName,
  date,
}: {
  orders: GroupOrderDetail[];
  templateName: string;
  date: string;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(orders.map((o) => o.unitId)),
  );
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  // 匯出當下才決定每個單位的團主顯示名稱，不寫進資料庫——各單位實際開團帳號常常是同一個人，
  // 但送給店家的單子上，各單位可能想標不同的人，所以用 order.id 各自記一份，預設帶入 hostName。
  const [displayNames, setDisplayNames] = useState<Record<string, string>>({});

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

  const paidKey = (orderId: string, memberId: string) => `${orderId}-${memberId}`;

  // 同一個人在同一團裡的多筆餐點合併成一列（rowSpan），付款狀態也是以「人」為單位標記
  const memberGroupsByOrder = (o: GroupOrderDetail) => {
    const groups: { memberId: string; memberName: string; lines: GroupOrderDetail["lines"] }[] = [];
    for (const l of o.lines) {
      const last = groups[groups.length - 1];
      if (last && last.memberId === l.memberId) last.lines.push(l);
      else groups.push({ memberId: l.memberId, memberName: l.memberName, lines: [l] });
    }
    return groups;
  };

  async function toggleMemberPaid(order: GroupOrderDetail, memberId: string, lineIds: string[], nextPaid: boolean) {
    const key = paidKey(order.id, memberId);
    setBusyKey(key);
    await setMemberPaidAction(order.id, lineIds, nextPaid);
    setBusyKey(null);
    router.refresh();
  }

  const participantNamesOf = (o: GroupOrderDetail) => [...new Set(o.lines.map((l) => l.memberName))];

  const selectedOrders = orders.filter((o) => selected.has(o.unitId));
  const combinedTotals = selectedOrders.reduce(
    (acc, o) => ({ qty: acc.qty + o.qty, amount: acc.amount + o.amount }),
    { qty: 0, amount: 0 },
  );
  const selectedMemberGroups = selectedOrders.flatMap((o) =>
    memberGroupsByOrder(o).map((g) => ({ order: o, group: g })),
  );
  const paidCount = selectedMemberGroups.filter(({ group }) => group.lines.every((l) => l.paid)).length;

  const buildUnitBlock = (o: GroupOrderDetail): (string | number)[][] => {
    const summary = summarizeOrderLines(o.lines);
    const totalQty = summary.reduce((sum, s) => sum + s.totalQty, 0);
    const displayName = displayNames[o.id]?.trim() || o.hostName;
    return [
      [displayName],
      ["餐點", "飯量", "數量"],
      ...summary.map((s) => [s.itemName, s.riceBreakdown, s.totalQty]),
      ["合計", "", totalQty],
    ];
  };

  function openExportDialog() {
    // 每次打開都重新帶入預設值（原本開團帳號的名字），不會保留上次亂改的殘留值。
    setDisplayNames(Object.fromEntries(selectedOrders.map((o) => [o.id, o.hostName])));
    setExportOpen(true);
  }

  const confirmExport = () => {
    const blocks = selectedOrders.map(buildUnitBlock);
    const allRows = blocks.flatMap((block, i) => (i === 0 ? block : [[], [], ...block]));
    const [firstRow, ...restRows] = allRows;
    downloadCsv(`${templateName}_${date}_單位彙總.csv`, firstRow, restRows);
    setExportOpen(false);
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
          value={`${paidCount} / ${selectedMemberGroups.length} 人`}
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
            {orders.map((o) => (
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
                  {o.departmentName} {o.unitName}
                </span>
                <span className="tabular-nums text-muted">
                  {o.qty} 份．NT$ {o.amount}
                </span>
              </label>
            ))}
          </div>
          <div className="flex justify-end">
            <Button disabled={selected.size === 0} onClick={openExportDialog}>
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
              <Th>團員</Th>
              <Th>餐點</Th>
              <Th>飯量</Th>
              <Th>數量</Th>
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
                const memberGroups = memberGroupsByOrder(o);
                return memberGroups.flatMap((mg, mgIndex) =>
                  mg.lines.map((l, li) => {
                    const key = paidKey(o.id, mg.memberId);
                    const paid = mg.lines.every((line) => line.paid);
                    const busy = busyKey === key;
                    return (
                      <tr key={`${o.id}-${mg.memberId}-${li}`}>
                        {mgIndex === 0 && li === 0 && (
                          <Td rowSpan={o.lines.length} className="align-middle">
                            {o.unitName}
                          </Td>
                        )}
                        {li === 0 && (
                          <Td rowSpan={mg.lines.length} className="align-middle">
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                toggleMemberPaid(
                                  o,
                                  mg.memberId,
                                  mg.lines.map((line) => line.id),
                                  !paid,
                                )
                              }
                              aria-label={paid ? "標記為未付款" : "標記為已付款"}
                              className={`mr-1.5 disabled:opacity-50 ${
                                paid ? "text-positive" : "text-muted hover:text-ink"
                              }`}
                            >
                              {paid ? "✓" : "○"}
                            </button>
                            {mg.memberId === o.hostId ? `${mg.memberName}（團主）` : mg.memberName}
                          </Td>
                        )}
                        <Td>{l.itemName}</Td>
                        <Td>{riceLevelLabel[l.rice]}</Td>
                        <Td className="tabular-nums">{l.qty}</Td>
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
              <Td>合計</Td>
              <Td />
              <Td />
              <Td />
              <Td className="tabular-nums">
                {combinedTotals.qty}
              </Td>
              <Td />
              <Td className="text-right tabular-nums">
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

      <Modal open={exportOpen} onClose={() => setExportOpen(false)} ariaLabel="匯出前確認各單位團主顯示名稱" className="max-w-lg">
        <ModalHeader
          title="匯出前確認各單位團主顯示名稱"
          subtitle="只影響這次匯出的 CSV，不會存到系統裡"
          onClose={() => setExportOpen(false)}
        />
        <div className="space-y-4 overflow-y-auto p-4">
          {selectedOrders.map((o) => (
            <div key={o.id} className="space-y-1.5 border-b border-line pb-4 last:border-0 last:pb-0">
              <Field label={`${o.departmentName} ${o.unitName}`}>
                <input
                  className={inputClass}
                  value={displayNames[o.id] ?? o.hostName}
                  onChange={(e) => setDisplayNames((prev) => ({ ...prev, [o.id]: e.target.value }))}
                />
              </Field>
              {participantNamesOf(o).length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {participantNamesOf(o).map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setDisplayNames((prev) => ({ ...prev, [o.id]: name }))}
                      className={`rounded-full border px-2.5 py-1 text-[13px] ${
                        name === (displayNames[o.id] ?? o.hostName)
                          ? "border-brand bg-brand-soft text-ink"
                          : "border-line text-muted hover:text-ink"
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setExportOpen(false)}>
              取消
            </Button>
            <Button onClick={confirmExport}>確認並下載</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
