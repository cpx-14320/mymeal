import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/components/ui/primitives";
import { ItemGrid } from "@/components/item-grid";
import { listItemCategories } from "@/lib/models/item-category";
import { listCatalogItems } from "@/lib/models/catalog-item";
import { getItemStatsByItems } from "@/lib/models/item-review";
import { listFavoritesByMember } from "@/lib/models/favorite";
import { getSessionMemberId } from "@/lib/session";

export const metadata: Metadata = { title: "我的收藏" };

export default async function FavoritesPage() {
  const memberId = await getSessionMemberId();
  if (!memberId) redirect("/login");

  const [categories, allItems, favorites] = await Promise.all([
    listItemCategories(),
    listCatalogItems(),
    listFavoritesByMember(memberId),
  ]);
  const items = allItems.filter((it) => it.active);
  const stats = await getItemStatsByItems(items.map((it) => it.id));
  const favoriteItemIds = favorites.map((f) => f.itemId);

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
