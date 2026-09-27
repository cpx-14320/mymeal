import { ItemsAdminSection } from "@/components/admin/items-admin-section";
import { listCatalogItems } from "@/lib/models/catalog-item";
import { listItemCategories } from "@/lib/models/item-category";
import { listTagGroups } from "@/lib/models/tag-group";
import { listPages } from "@/lib/models/page";

export const metadata = { title: "品項設定" };

export default async function AdminItemsPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const [items, categories, tagGroups, pages, params] = await Promise.all([
    listCatalogItems({ withCreatorLabels: true }),
    listItemCategories(),
    listTagGroups(),
    listPages(),
    searchParams,
  ]);

  return (
    <div className="space-y-8">
      <ItemsAdminSection
        items={items}
        categories={categories}
        tagGroups={tagGroups}
        pages={pages}
        justCreated={params.created === "1"}
      />
    </div>
  );
}
