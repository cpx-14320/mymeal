import { notFound } from "next/navigation";
import { Section } from "@/components/ui/primitives";
import { ItemForm } from "@/components/admin/item-form";
import { findCatalogItemById } from "@/lib/models/catalog-item";
import { listItemCategories } from "@/lib/models/item-category";
import { listPages } from "@/lib/models/page";
import { listTagGroups } from "@/lib/models/tag-group";

export const metadata = { title: "編輯品項" };

export default async function EditItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [item, categories, pages, tagGroups] = await Promise.all([
    findCatalogItemById(id),
    listItemCategories(),
    listPages(),
    listTagGroups(),
  ]);
  if (!item) notFound();

  return (
    <Section
      title={item.name}
      description="改名稱或預設價，所有引用此品項的模板同步；已成立的歷史訂單已快照，不受影響。"
    >
      <ItemForm item={item} categories={categories} pages={pages} tagGroups={tagGroups} />
    </Section>
  );
}
