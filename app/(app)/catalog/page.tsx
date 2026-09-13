import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/components/ui/primitives";
import { ItemCarousel } from "@/components/item-carousel";
import { ItemGrid } from "@/components/item-grid";

export const metadata: Metadata = { title: "所有品項" };

export default function CatalogPage() {
  return (
    <PageContainer>
      <PageHeader
        title="所有品項"
        description="瀏覽全部品項，收藏喜歡的口味，看看其他人怎麼評論。"
      />

      <ItemCarousel />

      <ItemGrid />

      <p className="text-xs text-muted">＊此頁為介面預覽，資料為範例。</p>
    </PageContainer>
  );
}
