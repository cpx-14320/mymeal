import { Section } from "@/components/ui/primitives";
import { MemberInsightsTable } from "@/components/admin/member-insights-table";

export const metadata = { title: "會員洞察" };

export default function MemberInsightsPage() {
  return (
    <Section
      title="會員洞察"
      description="分析每位會員的訂餐習慣；訂餐沒想法時，可以參考他平常喜歡點什麼。"
    >
      <MemberInsightsTable />
    </Section>
  );
}
