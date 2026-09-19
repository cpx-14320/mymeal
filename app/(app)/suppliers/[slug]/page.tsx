import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageContainer, PageHeader, EmptyState } from "@/components/ui/primitives";
import { ItemGrid } from "@/components/item-grid";
import { TopItemsCarousel } from "@/components/top-items-carousel";
import { findSupplierBySlug } from "@/lib/models/supplier";
import { listCatalogItemsBySupplier } from "@/lib/models/catalog-item";
import { listItemCategories } from "@/lib/models/item-category";
import { getItemStatsByItems } from "@/lib/models/item-review";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supplier = await findSupplierBySlug(slug);
  return { title: supplier ? supplier.name : "店家" };
}

export default async function SupplierPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supplier = await findSupplierBySlug(slug);
  if (!supplier) notFound();

  const [allItems, categories] = await Promise.all([listCatalogItemsBySupplier(supplier.id), listItemCategories()]);
  const items = allItems.filter((it) => it.active);
  const stats = await getItemStatsByItems(items.map((it) => it.id));

  return (
    <PageContainer>
      <PageHeader title={supplier.name} />
      {items.length === 0 ? (
        <EmptyState title="這家店還沒有上架任何品項" hint="品項會在後台「品項」指定店家後顯示在這裡。" />
      ) : (
        <>
          <TopItemsCarousel items={items} stats={stats} />
          <ItemGrid items={items} stats={stats} categories={categories} />
        </>
      )}
    </PageContainer>
  );
}
