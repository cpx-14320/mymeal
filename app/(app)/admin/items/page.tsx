import { Section, ButtonLink } from "@/components/ui/primitives";
import { AdminHeaderActions } from "@/components/layout/admin-header-actions";
import { ItemsTable } from "@/components/admin/items-table";
import { ItemsCsvButtons } from "@/components/admin/items-csv-buttons";
import { listCatalogItems } from "@/lib/models/catalog-item";
import { listItemCategories } from "@/lib/models/item-category";
import { listTagGroups } from "@/lib/models/tag-group";
import { listPages } from "@/lib/models/page";

export const metadata = { title: "品項設定" };

export default async function AdminItemsPage() {
  const [items, categories, tagGroups, pages] = await Promise.all([
    listCatalogItems(),
    listItemCategories(),
    listTagGroups(),
    listPages(),
  ]);

  return (
    <div className="space-y-8">
      <Section>
        <AdminHeaderActions>
          <ItemsCsvButtons items={items} tagGroups={tagGroups} />
          <ButtonLink href="/admin/items/new" size="sm">新增品項</ButtonLink>
        </AdminHeaderActions>

        <ItemsTable items={items} categories={categories} tagGroups={tagGroups} pages={pages} />
      </Section>
    </div>
  );
}
