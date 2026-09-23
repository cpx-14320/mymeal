import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageContainer, PageHeader, EmptyState } from "@/components/ui/primitives";
import { ItemGrid } from "@/components/item-grid";
import { TemplateMenuSections } from "@/components/template-menu-sections";
import { TopItemsCarousel } from "@/components/top-items-carousel";
import { findPageBySlug } from "@/lib/models/page";
import { findTemplateById } from "@/lib/models/template";
import { listCatalogItemsByPage, listCatalogItemsByIds, type CatalogItemView } from "@/lib/models/catalog-item";
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
  const page = await findPageBySlug(slug);
  return { title: page ? page.name : "頁面" };
}

export default async function PageDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await findPageBySlug(slug);
  if (!page) notFound();

  const memberId = await getSessionMemberId();

  // 有套用模板：整頁改顯示模板內容（依 section 分組），取代頁面自己的品項。
  if (page.templateId) {
    const template = await findTemplateById(page.templateId);
    if (!template) {
      return (
        <PageContainer>
          <PageHeader title={page.name} />
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
        <PageHeader title={page.name} />
        {page.showTopItems && <TopItemsCarousel items={fullItems} stats={stats} />}
        <TemplateMenuSections
          sections={sections}
          stats={stats}
          initialFavoriteIds={favorites.map((f) => f.itemId)}
        />
      </PageContainer>
    );
  }

  const [allItems, categories] = await Promise.all([
    listCatalogItemsByPage(page.id),
    listItemCategories(),
  ]);
  const items = allItems.filter((it) => it.active);
  const [stats, favorites] = await Promise.all([
    getItemStatsByItems(items.map((it) => it.id)),
    memberId ? listFavoritesByMember(memberId) : Promise.resolve([]),
  ]);

  return (
    <PageContainer>
      <PageHeader title={page.name} />
      {items.length === 0 ? (
        <EmptyState title="這個頁面還沒有上架任何品項" hint="品項會在後台「品項」指定頁面後顯示在這裡。" />
      ) : (
        <>
          {page.showTopItems && <TopItemsCarousel items={items} stats={stats} />}
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
