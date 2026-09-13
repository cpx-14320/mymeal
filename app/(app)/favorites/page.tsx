import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/components/ui/primitives";
import { ItemGrid } from "@/components/item-grid";

export const metadata: Metadata = { title: "我的收藏" };

const favoriteItemIds = ["c1", "c6", "c4", "c9", "c8"];

export default function FavoritesPage() {
  return (
    <PageContainer>
      <PageHeader
        title="我的收藏"
        description="收藏喜歡的品項，看看其他人怎麼評論。"
      />

      <ItemGrid scope="favorites" initialFavoriteIds={favoriteItemIds} />

      <p className="text-xs text-muted">＊此頁為介面預覽，資料為範例。</p>
    </PageContainer>
  );
}
