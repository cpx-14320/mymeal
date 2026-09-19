import { Section } from "@/components/ui/primitives";
import { ItemStatsTable } from "@/components/admin/item-stats-table";
import { listItemStats } from "@/lib/models/catalog-item";

export const metadata = { title: "餐點統計" };

export default async function ItemStatsPage() {
  const stats = await listItemStats();

  return (
    <Section
      title="餐點統計"
      description="彙總所有會員的訂餐、評分、評論，看哪個品項最受歡迎。"
    >
      <ItemStatsTable stats={stats} />
    </Section>
  );
}
