import { Section } from "@/components/ui/primitives";
import { ItemForm } from "@/components/admin/item-form";
import { listItemCategories } from "@/lib/models/item-category";
import { listPages } from "@/lib/models/page";
import { listTagGroups } from "@/lib/models/tag-group";

export const metadata = { title: "新增品項" };

export default async function NewItemPage() {
  const [categories, pages, tagGroups] = await Promise.all([
    listItemCategories(),
    listPages(),
    listTagGroups(),
  ]);

  return (
    <Section
      title="新增品項"
      description="新增後，此品項會出現在「品項設定」列表中，供各模板挑選使用。"
    >
      <ItemForm categories={categories} pages={pages} tagGroups={tagGroups} />
    </Section>
  );
}
