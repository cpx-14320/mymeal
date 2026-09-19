import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/components/ui/primitives";
import { ItemCarousel } from "@/components/item-carousel";
import { ItemGrid } from "@/components/item-grid";
import { listItemCategories } from "@/lib/models/item-category";
import { listCatalogItems } from "@/lib/models/catalog-item";
import { getItemStatsByItems } from "@/lib/models/item-review";
import { listFavoritesByMember } from "@/lib/models/favorite";
import { getSessionMemberId } from "@/lib/session";

export const metadata: Metadata = { title: "所有品項" };

export default async function CatalogPage() {
  const [categories, allItems, memberId] = await Promise.all([
    listItemCategories(),
    listCatalogItems(),
    getSessionMemberId(),
  ]);
  const items = allItems.filter((it) => it.active);
  const [stats, favorites] = await Promise.all([
    getItemStatsByItems(items.map((it) => it.id)),
    memberId ? listFavoritesByMember(memberId) : Promise.resolve([]),
  ]);

  return (
    <PageContainer>
      <PageHeader
        title="所有品項"
        description="瀏覽全部品項，收藏喜歡的口味，看看其他人怎麼評論。"
      />

      <ItemCarousel />

      <ItemGrid
        items={items}
        stats={stats}
        categories={categories}
        initialFavoriteIds={favorites.map((f) => f.itemId)}
      />
    </PageContainer>
  );
}
