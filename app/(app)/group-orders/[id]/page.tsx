import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  PageContainer,
  PageHeader,
  Card,
  CardBody,
  Badge,
  Button,
  ButtonLink,
  Stat,
  TableWrap,
  Th,
  Td,
} from "@/components/ui/primitives";
import { GroupOrderForm } from "@/components/group-order-form";
import { GroupOrderExportButton } from "@/components/group-order-export-button";
import {
  groupOrderById,
  groupOrderTotals,
  templateById,
  unitById,
  departmentById,
  itemById,
  riceLevelLabel,
} from "@/lib/mock";

const statusMap = {
  open: { label: "開放中", tone: "positive" as const },
  closed: { label: "已截止", tone: "warning" as const },
  completed: { label: "已完成", tone: "neutral" as const },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const group = groupOrderById(id);
  return { title: group ? `團訂明細：${group.name}` : "團訂明細" };
}

export default async function GroupOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const group = groupOrderById(id);
  if (!group) notFound();

  const tpl = templateById(group.templateId);
  const unit = unitById(group.unitId);
  const dept = unit ? departmentById(unit.departmentId) : undefined;
  const totals = groupOrderTotals(group);

  const dishIds = [
    ...new Set(tpl ? tpl.sections.flatMap((s) => s.itemIds) : []),
  ];
  const dishes = dishIds
    .map((id2) => itemById(id2))
    .filter((it): it is NonNullable<typeof it> => Boolean(it));

  const lineGroups: {
    memberId: string;
    memberName: string;
    lines: typeof group.lines;
  }[] = [];
  for (const l of group.lines) {
    const last = lineGroups[lineGroups.length - 1];
    if (last && last.memberId === l.memberId) last.lines.push(l);
    else lineGroups.push({ memberId: l.memberId, memberName: l.memberName, lines: [l] });
  }

  return (
    <PageContainer>
      <PageHeader
        title={group.name}
        description={`團訂 #${group.id}．模板：${tpl?.name ?? group.templateId}．${dept && unit ? `${dept.name} ${unit.name}．` : ""}${group.date} 取餐`}
        actions={<Badge tone={statusMap[group.status].tone}>{statusMap[group.status].label}</Badge>}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="截止時間" value={group.deadline} />
        <Stat label="目前份數" value={`${totals.qty} 份`} hint={`NT$ ${totals.amount}`} />
        <Stat label="所屬單位" value={unit?.name ?? "—"} hint={`團主：${group.host}`} />
      </div>

      {/* 我的餐點 */}
      <Card>
        <CardBody className="space-y-4">
          <h2 className="text-lg font-bold tracking-tight">
            點餐{" "}
            <span className="text-sm font-normal text-muted">
            （品項為本團清單，開團時可由團主調整）
            </span>
          </h2>
          <GroupOrderForm dishes={dishes} />
        </CardBody>
      </Card>

      {/* 目前訂購清單 */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold tracking-tight">目前訂購清單</h2>
        <TableWrap>
          <thead>
            <tr>
              <Th>同事</Th>
              <Th>餐點</Th>
              <Th className="text-center">飯量</Th>
              <Th className="text-center">數量</Th>
              <Th>備註</Th>
              <Th className="text-right">小計</Th>
            </tr>
          </thead>
          <tbody>
            {lineGroups.map((grp) =>
              grp.lines.map((l, li) => (
                <tr key={`${grp.memberId}-${li}`}>
                  {li === 0 && (
                    <Td rowSpan={grp.lines.length} className="align-middle">
                      {grp.memberName === group.host
                        ? `${grp.memberName}（團主）`
                        : grp.memberName}
                    </Td>
                  )}
                  <Td>{l.itemName}</Td>
                  <Td className="text-center">{riceLevelLabel[l.rice]}</Td>
                  <Td className="text-center tabular-nums">{l.qty}</Td>
                  <Td className="text-muted">{l.note || "—"}</Td>
                  <Td className="text-right tabular-nums">NT$ {l.price * l.qty}</Td>
                </tr>
              )),
            )}
            <tr>
              <Td className="font-semibold">合計</Td>
              <Td />
              <Td />
              <Td className="text-center font-semibold tabular-nums">
                {totals.qty}
              </Td>
              <Td />
              <Td className="text-right font-semibold tabular-nums">
                NT$ {totals.amount}
              </Td>
            </tr>
          </tbody>
        </TableWrap>
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <ButtonLink href="/group-orders" variant="ghost">
          返回列表
        </ButtonLink>
        <GroupOrderExportButton
          lines={group.lines}
          host={group.host}
          filename={`${group.name}_訂購彙總.csv`}
        />
        <Button variant="danger">取消整團</Button>
        <Button>提前結單</Button>
      </div>

      <p className="text-xs text-muted">＊此頁為介面預覽，資料為範例。</p>
    </PageContainer>
  );
}
