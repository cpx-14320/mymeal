import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageContainer, PageHeader, EmptyState } from "@/components/ui/primitives";
import { ItemGrid } from "@/components/item-grid";
import { TemplateMenuSections } from "@/components/template-menu-sections";
import { TopItemsCarousel } from "@/components/top-items-carousel";
import { findSupplierBySlug } from "@/lib/models/supplier";
import { findTemplateById } from "@/lib/models/template";
import { listCatalogItemsBySupplier, listCatalogItemsByIds, type CatalogItemView } from "@/lib/models/catalog-item";
import { listItemCategories } from "@/lib/models/item-category";
import { getItemStatsByItems } from "@/lib/models/item-review";
import { listFavoritesByMember } from "@/lib/models/favorite";
import { getSessionMemberId } from "@/lib/session";

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

  const memberId = await getSessionMemberId();

  // 有套用模板：整頁改顯示模板內容（依 section 分組），取代店家自己的品項。
  if (supplier.templateId) {
    const template = await findTemplateById(supplier.templateId);
    if (!template) {
      return (
        <PageContainer>
          <PageHeader title={supplier.name} />
          <EmptyState title="套用的模板已被刪除" hint="請到後台「頁面設定」重新指定一個模板，或取消套用。" />
        </PageContainer>
      );
    }

    const allItemIds = template.sections.flatMap((sec) => sec.items.map((it) => it.id));
    const [fullItems, favorites] = await Promise.all([
      listCatalogItemsByIds(allItemIds),
      memberId ? listFavoritesByMember(memberId) : Promise.resolve([]),
    ]);
    const itemById = new Map(fullItems.map((it) => [it.id, it]));
    const sections = template.sections.map((sec) => ({
      id: sec.id,
      name: sec.name,
      items: sec.items
        .map((it) => itemById.get(it.id))
        .filter((it): it is CatalogItemView => !!it && it.active),
    }));
    const stats = await getItemStatsByItems(fullItems.map((it) => it.id));

    return (
      <PageContainer>
        <PageHeader title={supplier.name} />
        {supplier.showTopItems && <TopItemsCarousel items={fullItems} stats={stats} />}
        <TemplateMenuSections
          sections={sections}
          stats={stats}
          initialFavoriteIds={favorites.map((f) => f.itemId)}
        />
      </PageContainer>
    );
  }

  const [allItems, categories] = await Promise.all([
    listCatalogItemsBySupplier(supplier.id),
    listItemCategories(),
  ]);
  const items = allItems.filter((it) => it.active);
  const [stats, favorites] = await Promise.all([
    getItemStatsByItems(items.map((it) => it.id)),
    memberId ? listFavoritesByMember(memberId) : Promise.resolve([]),
  ]);

  return (
    <PageContainer>
      <PageHeader title={supplier.name} />
      {items.length === 0 ? (
        <EmptyState title="這家店還沒有上架任何品項" hint="品項會在後台「品項」指定店家後顯示在這裡。" />
      ) : (
        <>
          {supplier.showTopItems && <TopItemsCarousel items={items} stats={stats} />}
          <ItemGrid
            items={items}
            stats={stats}
            categories={categories}
            initialFavoriteIds={favorites.map((f) => f.itemId)}
          />
        </>
      )}
    </PageContainer>
  );
}
