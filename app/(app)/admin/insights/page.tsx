import { Section } from "@/components/ui/primitives";
import { MemberInsightsTable } from "@/components/admin/member-insights-table";
import { listMembers } from "@/lib/models/member";
import { countFavoritesByMembers } from "@/lib/models/favorite";
import { countReviewsByMembers } from "@/lib/models/item-review";
import { listMemberBalances } from "@/lib/models/wallet";

export const metadata = { title: "會員洞察" };

export default async function MemberInsightsPage() {
  const members = await listMembers();
  const memberIds = members.map((m) => m.id);
  const [favoriteCounts, reviewCounts, walletBalances] = await Promise.all([
    countFavoritesByMembers(memberIds),
    countReviewsByMembers(memberIds),
    listMemberBalances(),
  ]);
  const balances = Object.fromEntries(walletBalances.map((b) => [b.memberId, b.balance]));

  return (
    <Section>
      <MemberInsightsTable
        members={members}
        favoriteCounts={favoriteCounts}
        ratingCounts={reviewCounts.ratings}
        commentCounts={reviewCounts.comments}
        balances={balances}
      />
    </Section>
  );
}
