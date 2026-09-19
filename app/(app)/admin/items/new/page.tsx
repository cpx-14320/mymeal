import { Section, ButtonLink } from "@/components/ui/primitives";
import { ItemForm } from "@/components/admin/item-form";
import { listItemKinds } from "@/lib/models/item-kind";
import { listItemCategories } from "@/lib/models/item-category";
import { listSuppliers } from "@/lib/models/supplier";
import { listTagGroups } from "@/lib/models/tag-group";

export const metadata = { title: "新增品項" };

export default async function NewItemPage() {
  const [kinds, categories, suppliers, tagGroups] = await Promise.all([
    listItemKinds(),
    listItemCategories(),
    listSuppliers(),
    listTagGroups(),
  ]);

  return (
    <Section
      title="新增品項"
      description="加進品項後，就能在模板裡選用。"
      actions={
        <ButtonLink href="/admin/items" variant="ghost">
          返回列表
        </ButtonLink>
      }
    >
      <ItemForm kinds={kinds} categories={categories} suppliers={suppliers} tagGroups={tagGroups} />
    </Section>
  );
}
