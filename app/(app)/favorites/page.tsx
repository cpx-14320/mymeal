import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/components/ui/primitives";
import { ItemGrid } from "@/components/item-grid";
import { listItemCategories } from "@/lib/models/item-category";
import { listCatalogItems } from "@/lib/models/catalog-item";
import { getItemStatsByItems } from "@/lib/models/item-review";

export const metadata: Metadata = { title: "我的收藏" };

// 收藏功能還沒接真資料（見 lib/models/favorite.ts），先固定沒有任何收藏。
const favoriteItemIds: string[] = [];

export default async function FavoritesPage() {
  const [categories, allItems] = await Promise.all([listItemCategories(), listCatalogItems()]);
  const items = allItems.filter((it) => it.active);
  const stats = await getItemStatsByItems(items.map((it) => it.id));

  return (
    <PageContainer>
      <PageHeader
        title="我的收藏"
        description="收藏喜歡的品項，看看其他人怎麼評論。"
      />

      <ItemGrid
        scope="favorites"
        initialFavoriteIds={favoriteItemIds}
        items={items}
        stats={stats}
        categories={categories}
        defaultPageSize={25}
      />
    </PageContainer>
  );
}
