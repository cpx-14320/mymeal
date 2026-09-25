import { notFound } from "next/navigation";
import { TemplateEditor } from "@/components/admin/template-editor";
import { findTemplateById } from "@/lib/models/template";
import { listPages } from "@/lib/models/page";
import { listCatalogItems } from "@/lib/models/catalog-item";
import { listItemCategories } from "@/lib/models/item-category";

export const metadata = { title: "編輯模板" };

export default async function TemplateEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [template, pages, items, categories] = await Promise.all([
    findTemplateById(id),
    listPages(),
    listCatalogItems(),
    listItemCategories(),
  ]);
  if (!template) notFound();

  return (
    <TemplateEditor
      template={template}
      pages={pages}
      items={items.filter((it) => it.active)}
      categories={categories}
    />
  );
}
