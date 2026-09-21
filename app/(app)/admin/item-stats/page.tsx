import { Section } from "@/components/ui/primitives";
import { ItemStatsTable } from "@/components/admin/item-stats-table";
import { listItemStats } from "@/lib/models/catalog-item";

export const metadata = { title: "餐點統計" };

export default async function ItemStatsPage() {
  const stats = await listItemStats();

  return (
    <Section>
      <ItemStatsTable stats={stats} />
    </Section>
  );
}
