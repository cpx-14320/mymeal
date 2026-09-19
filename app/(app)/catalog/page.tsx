import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/components/ui/primitives";
import { ItemCarousel } from "@/components/item-carousel";
import { ItemGrid } from "@/components/item-grid";
import { listItemCategories } from "@/lib/models/item-category";
import { listCatalogItems } from "@/lib/models/catalog-item";
import { getItemStatsByItems } from "@/lib/models/item-review";

export const metadata: Metadata = { title: "所有品項" };

export default async function CatalogPage() {
  const [categories, allItems] = await Promise.all([listItemCategories(), listCatalogItems()]);
  const items = allItems.filter((it) => it.active);
  const stats = await getItemStatsByItems(items.map((it) => it.id));

  return (
    <PageContainer>
      <PageHeader
        title="所有品項"
        description="瀏覽全部品項，收藏喜歡的口味，看看其他人怎麼評論。"
      />

      <ItemCarousel />

      <ItemGrid items={items} stats={stats} categories={categories} />
    </PageContainer>
  );
}
