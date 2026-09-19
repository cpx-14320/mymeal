import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Section, ButtonLink, Stat } from "@/components/ui/primitives";
import { MemberInsightTabs } from "@/components/admin/member-insight-tabs";
import { findMemberById } from "@/lib/models/member";
import { listFavoritesByMember } from "@/lib/models/favorite";
import { listReviewsByMember, listCommentsByMember } from "@/lib/models/item-review";
import { getMemberBalance, listLedgerForMember } from "@/lib/models/wallet";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const member = await findMemberById(id);
  return { title: member ? `會員洞察：${member.name}` : "會員洞察" };
}

export default async function MemberInsightDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [member, favorites, ratings, comments, balance, ledger] = await Promise.all([
    findMemberById(id),
    listFavoritesByMember(id),
    listReviewsByMember(id),
    listCommentsByMember(id),
    getMemberBalance(id),
    listLedgerForMember(id),
  ]);
  if (!member) notFound();

  return (
    <div className="space-y-8">
      <Section
        title={`會員洞察：${member.name}`}
        description={`${member.dept}．${member.unit}．${member.account}`}
        actions={
          <ButtonLink href="/admin/insights" variant="ghost">
            返回列表
          </ButtonLink>
        }
      >
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label="訂單數" value={0} />
          <Stat label="便當數" value={0} />
          <Stat label="收藏" value={favorites.length} />
          <Stat label="評論" value={comments.length} />
          <Stat label="評分" value={ratings.length} />
          <Stat label="剩餘儲值" value={`NT$ ${balance}`} />
        </div>
      </Section>

      <Section
        title="詳細紀錄"
        description="儲值、訂餐、收藏、評論、評分——資料會持續累積，用分頁瀏覽。"
      >
        <MemberInsightTabs
          breakdown={[]}
          ledger={ledger}
          favorites={favorites}
          comments={comments}
          ratings={ratings}
        />
      </Section>
    </div>
  );
}
