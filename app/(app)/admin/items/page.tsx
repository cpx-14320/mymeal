import { Section, ButtonLink, Note } from "@/components/ui/primitives";
import { ItemsTable } from "@/components/admin/items-table";
import { listCatalogItems } from "@/lib/models/catalog-item";
import { listItemCategories } from "@/lib/models/item-category";
import { listTagGroups } from "@/lib/models/tag-group";

export const metadata = { title: "品項" };

export default async function AdminItemsPage() {
  const [items, categories, tagGroups] = await Promise.all([
    listCatalogItems(),
    listItemCategories(),
    listTagGroups(),
  ]);

  return (
    <div className="space-y-8">
      <Section
        title="品項"
        description="所有可訂購品項的唯一來源，模板從這裡挑。改名稱或預設價，所有引用同步。"
        actions={<ButtonLink href="/admin/items/new">新增品項</ButtonLink>}
      >
        <Note>「上週有雞腿飯、這週也有」→ 只要是同一筆品項，就是同一列資料；不用重複建立。</Note>

        <ItemsTable items={items} categories={categories} tagGroups={tagGroups} />
      </Section>
    </div>
  );
}
