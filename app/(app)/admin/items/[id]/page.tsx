import { notFound } from "next/navigation";
import { Section, ButtonLink } from "@/components/ui/primitives";
import { ItemForm } from "@/components/admin/item-form";
import { findCatalogItemById } from "@/lib/models/catalog-item";
import { listItemKinds } from "@/lib/models/item-kind";
import { listItemCategories } from "@/lib/models/item-category";
import { listSuppliers } from "@/lib/models/supplier";
import { listTagGroups } from "@/lib/models/tag-group";

export const metadata = { title: "編輯品項" };

export default async function EditItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [item, kinds, categories, suppliers, tagGroups] = await Promise.all([
    findCatalogItemById(id),
    listItemKinds(),
    listItemCategories(),
    listSuppliers(),
    listTagGroups(),
  ]);
  if (!item) notFound();

  return (
    <Section
      title={`編輯品項：${item.name}`}
      description="改名稱或預設價，所有引用此品項的模板同步；已成立的歷史訂單已快照，不受影響。"
      actions={
        <ButtonLink href="/admin/items" variant="ghost">
          返回列表
        </ButtonLink>
      }
    >
      <ItemForm item={item} kinds={kinds} categories={categories} suppliers={suppliers} tagGroups={tagGroups} />
    </Section>
  );
}
