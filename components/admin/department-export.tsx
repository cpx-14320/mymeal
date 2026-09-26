"use client";

import { useEffect, useState } from "react";
import { Section, Button, Stat, TableWrap, Th, Td } from "@/components/ui/primitives";
import type { OrgOption } from "@/lib/models/org";
import type { DepartmentExportSummary } from "@/lib/models/group-order";
import { getDepartmentExportSummaryAction } from "@/app/(app)/admin/group-orders/actions";

/**
 * 部門負責人視角：選一個部門，跨底下所有單位彙總團訂資料，一次匯出。
 * 對照單位負責人只會在上面表格裡看到、匯出自己單位的團。
 */
export function DepartmentExport({ departments }: { departments: OrgOption[] }) {
  const [departmentId, setDepartmentId] = useState(departments[0]?.id ?? "");
  const [summary, setSummary] = useState<DepartmentExportSummary | null>(null);

  useEffect(() => {
    if (!departmentId) return;
    let cancelled = false;
    getDepartmentExportSummaryAction(departmentId).then((s) => {
      if (!cancelled) setSummary(s);
    });
    return () => {
      cancelled = true;
    };
  }, [departmentId]);

  if (departments.length === 0) {
    return (
      <Section title="依部門匯出" description="還沒有任何部門，先到「部門與單位」頁建立。">
        <p className="text-[13px] lg:text-[14px] text-muted">尚無可彙總的部門。</p>
      </Section>
    );
  }

  return (
    <Section
      title="依部門匯出"
      description="部門負責人可以跨底下所有單位，一次彙總、匯出整個部門的團訂資料。"
      actions={
        <select
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value)}
          className="rounded-lg border border-line bg-surface px-3 py-2 text-[13px] lg:text-[14px] text-ink outline-none focus:border-brand"
        >
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      }
    >
      {summary && (
        <>
          <div className="grid gap-3 sm:grid-cols-4">
            <Stat label="單位數" value={summary.unitCount} />
            <Stat label="團數" value={summary.orderCount} />
            <Stat label="總份數" value={summary.totalQty} />
            <Stat label="總金額" value={`NT$ ${summary.totalAmount}`} />
          </div>

          <TableWrap>
            <thead>
              <tr>
                <Th>單位</Th>
                <Th>團數</Th>
                <Th>份數</Th>
                <Th className="text-right">金額</Th>
              </tr>
            </thead>
            <tbody>
              {summary.byUnit.length === 0 ? (
                <tr>
                  <Td colSpan={4} className="text-center text-muted">
                    這個部門底下還沒有單位。
                  </Td>
                </tr>
              ) : (
                summary.byUnit.map((u) => (
                  <tr key={u.unitId}>
                    <Td>{u.unitName}</Td>
                    <Td className="tabular-nums">{u.orderCount}</Td>
                    <Td className="tabular-nums">{u.qty}</Td>
                    <Td className="text-right tabular-nums">NT$ {u.amount}</Td>
                  </tr>
                ))
              )}
            </tbody>
          </TableWrap>

          <div className="flex justify-end">
            <Button>匯出「{summary.departmentName}」全部單位資料</Button>
          </div>
        </>
      )}
    </Section>
  );
}
