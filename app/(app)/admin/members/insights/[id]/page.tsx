import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Section, ButtonLink, Stat, Note } from "@/components/ui/primitives";
import { MemberInsightTabs } from "@/components/admin/member-insight-tabs";
import {
  memberById,
  memberInsightById,
  memberInsightSummary,
  itemById,
  itemKindLabel,
} from "@/lib/mock";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const member = memberById(id);
  return { title: member ? `會員洞察：${member.name}` : "會員洞察" };
}

export default async function MemberInsightDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const member = memberById(id);
  const insight = memberInsightById(id);
  if (!member || !insight) notFound();

  const summary = memberInsightSummary(id);

  const kindTally: Partial<Record<string, number>> = {};
  const nameTally: Record<string, number> = {};
  for (const o of insight.orders) {
    const item = itemById(o.itemId);
    if (item) kindTally[item.kind] = (kindTally[item.kind] ?? 0) + 1;
    nameTally[o.itemName] = (nameTally[o.itemName] ?? 0) + 1;
  }
  const topKind = Object.entries(kindTally).sort((a, b) => b[1]! - a[1]!)[0];
  const topItem = Object.entries(nameTally).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="space-y-8">
      <Section
        title={`會員洞察：${member.name}`}
        description={`${member.dept}．${member.unit}．${member.account}`}
        actions={
          <ButtonLink href="/admin/members/insights" variant="ghost">
            返回列表
          </ButtonLink>
        }
      >
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label="訂單數" value={summary.orderCount} />
          <Stat label="便當數" value={summary.mealCount} />
          <Stat label="收藏" value={summary.favoriteCount} />
          <Stat label="評論" value={summary.commentCount} />
          <Stat label="評分" value={summary.ratingCount} />
          <Stat label="剩餘儲值" value={`NT$ ${summary.balance}`} />
        </div>

        {topKind && topItem && (
          <div className="mt-4">
            <Note>
              推測偏好：{itemKindLabel[topKind[0] as keyof typeof itemKindLabel]}
              　最常點：{topItem[0]}（{topItem[1]} 次）
            </Note>
          </div>
        )}
      </Section>

      <Section
        title="詳細紀錄"
        description="儲值、訂餐、收藏、評論、評分——資料會持續累積，用分頁瀏覽。"
      >
        <MemberInsightTabs id={id} insight={insight} />
      </Section>

      <p className="text-xs text-muted">＊此頁為介面預覽，資料為範例。</p>
    </div>
  );
}
