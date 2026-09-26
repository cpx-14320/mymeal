import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  PageContainer,
  PageHeader,
  Card,
  CardBody,
  Badge,
  ButtonLink,
  Stat,
  StatGrid3,
  COMPACT_STAT_VALUE_CLASS,
  TableWrap,
  Th,
  Td,
} from "@/components/ui/primitives";
import { GroupOrderForm, type OrderableDish } from "@/components/group-order-form";
import { GroupOrderExportButton } from "@/components/group-order-export-button";
import { GroupOrderHostActions } from "@/components/group-order-host-actions";
import { GroupOrderDeadlineStat } from "@/components/group-order-deadline-stat";
import { findGroupOrderById, getMemberFrequentItems, type RiceLevel } from "@/lib/models/group-order";
import { findTemplateById } from "@/lib/models/template";
import { findMemberById } from "@/lib/models/member";
import { getMemberBalance } from "@/lib/models/wallet";
import { getSessionMemberId } from "@/lib/session";

const statusMap = {
  open: { label: "開放中", tone: "positive" as const },
  closed: { label: "已截止", tone: "warning" as const },
  completed: { label: "已完成", tone: "neutral" as const },
};

const riceLevelLabel: Record<RiceLevel, string> = { normal: "正常", half: "半飯", none: "不要飯" };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const group = await findGroupOrderById(id);
  return { title: group ? `團訂明細：${group.name}` : "團訂明細" };
}

export default async function GroupOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const group = await findGroupOrderById(id);
  if (!group) notFound();

  const memberId = await getSessionMemberId();
  if (!memberId) redirect("/login");
  const viewer = await findMemberById(memberId);
  if (!viewer) redirect("/login");

  const [tpl, walletBalance] = await Promise.all([
    findTemplateById(group.templateId),
    getMemberBalance(memberId),
  ]);

  const dishMap = new Map<string, OrderableDish>();
  if (tpl) {
    // 有選分類（例如「星期一」）就只能點那個分類的品項；舊資料沒有分類時維持整個模板都能點。
    const sections = group.sectionId
      ? tpl.sections.filter((sec) => sec.id === group.sectionId)
      : tpl.sections;
    for (const sec of sections) {
      for (const it of sec.items) {
        dishMap.set(it.id, { id: it.id, name: it.name, emoji: it.emoji, price: it.price, imageUrl: it.imageUrl });
      }
    }
  }
  const dishes = [...dishMap.values()];

  // 只推薦這個團的模板裡真的有賣的品項；已經點過的品項還是會顯示，方便直接在這裡調整數量。
  // 只顯示一個——避免選項太多反而讓人猶豫，直接給這位會員在「這個團可點的範圍內」總份數點最多的那一道
  // （在資料庫查詢時就限定在這個範圍內排名，而不是先抓全站排名前幾名再篩選，避免範圍內真正點最多的品項
  // 因為全站排名沒進前幾名而被漏掉）。
  const frequentItems = await getMemberFrequentItems(
    memberId,
    1,
    dishes.map((d) => d.id),
  );
  const recommendedDishIds = frequentItems.map((f) => f.itemId);

  const existingLines = group.lines
    .filter((l) => l.memberId === memberId)
    .map((l) => ({
      itemId: l.itemId,
      qty: l.qty,
      rice: l.rice,
      note: l.note,
      paymentMethod: l.paymentMethod,
      bankCode: l.bankCode,
    }));

  const lineGroups: { memberId: string; memberName: string; lines: typeof group.lines }[] = [];
  for (const l of group.lines) {
    const last = lineGroups[lineGroups.length - 1];
    if (last && last.memberId === l.memberId) last.lines.push(l);
    else lineGroups.push({ memberId: l.memberId, memberName: l.memberName, lines: [l] });
  }

  return (
    <PageContainer spacingClassName="space-y-4 sm:space-y-8">
      <PageHeader
        title={group.name}
        actions={<Badge tone={statusMap[group.status].tone}>{statusMap[group.status].label}</Badge>}
      />

      <StatGrid3>
        <GroupOrderDeadlineStat
          groupOrderId={group.id}
          deadline={group.deadline}
          editable={memberId === group.hostId && group.status === "open"}
        />
        <Stat
          label="目前份數"
          value={`${group.qty} 份`}
          hint={`NT$ ${group.amount}`}
          valueClassName={COMPACT_STAT_VALUE_CLASS}
        />
        <Stat
          label="所屬單位"
          value={group.unitName || "—"}
          hint={`團主：${group.hostName}`}
          valueClassName={COMPACT_STAT_VALUE_CLASS}
        />
      </StatGrid3>

      {/* 我的餐點 */}
      <Card>
        <CardBody className="space-y-4">
          <h2 className="text-lg font-bold tracking-tight">點餐區</h2>
          {dishes.length === 0 ? (
            <p className="text-sm text-muted">這個模板還沒有品項可以點。</p>
          ) : (
            <GroupOrderForm
              groupOrderId={group.id}
              dishes={dishes}
              recommendedDishIds={recommendedDishIds}
              existingLines={existingLines}
              memberId={memberId}
              memberName={viewer.name}
              walletBalance={walletBalance}
            />
          )}
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
              <Th>飯量</Th>
              <Th>數量</Th>
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
                      {grp.memberId === group.hostId ? `${grp.memberName}（團主）` : grp.memberName}
                    </Td>
                  )}
                  <Td>{l.itemName}</Td>
                  <Td>{riceLevelLabel[l.rice]}</Td>
                  <Td className="tabular-nums">{l.qty}</Td>
                  <Td className="text-muted">{l.note || "—"}</Td>
                  <Td className="text-right tabular-nums">NT$ {l.price * l.qty}</Td>
                </tr>
              )),
            )}
            {group.lines.length === 0 && (
              <tr>
                <Td colSpan={6} className="text-center text-muted">
                  還沒有人點餐。
                </Td>
              </tr>
            )}
            <tr>
              <Td>合計</Td>
              <Td />
              <Td />
              <Td className="tabular-nums">{group.qty}</Td>
              <Td />
              <Td className="text-right tabular-nums">NT$ {group.amount}</Td>
            </tr>
          </tbody>
        </TableWrap>
      </div>

      {memberId === group.hostId ? (
        <GroupOrderHostActions
          groupOrderId={group.id}
          status={group.status}
          trailingActions={
            <>
              <ButtonLink href="/group-orders" variant="ghost">
                返回列表
              </ButtonLink>
              <GroupOrderExportButton
                lines={group.lines}
                host={group.hostName}
                filename={`${group.name}_訂購彙總.csv`}
              />
            </>
          }
        />
      ) : (
        <div className="flex flex-wrap justify-end gap-2">
          <ButtonLink href="/group-orders" variant="ghost">
            返回列表
          </ButtonLink>
          <GroupOrderExportButton
            lines={group.lines}
            host={group.hostName}
            filename={`${group.name}_訂購彙總.csv`}
          />
        </div>
      )}
    </PageContainer>
  );
}
