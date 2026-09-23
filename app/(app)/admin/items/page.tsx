import { Section, ButtonLink } from "@/components/ui/primitives";
import { AdminHeaderActions } from "@/components/layout/admin-header-actions";
import { ItemsTable } from "@/components/admin/items-table";
import { listCatalogItems } from "@/lib/models/catalog-item";
import { listItemCategories } from "@/lib/models/item-category";
import { listTagGroups } from "@/lib/models/tag-group";

export const metadata = { title: "品項設定" };

export default async function AdminItemsPage() {
  const [items, categories, tagGroups] = await Promise.all([
    listCatalogItems(),
    listItemCategories(),
    listTagGroups(),
  ]);

  return (
    <div className="space-y-8">
      <Section>
        <AdminHeaderActions>
          <ButtonLink href="/admin/items/new" size="sm">新增品項</ButtonLink>
        </AdminHeaderActions>

        <ItemsTable items={items} categories={categories} tagGroups={tagGroups} />
      </Section>
    </div>
  );
}
