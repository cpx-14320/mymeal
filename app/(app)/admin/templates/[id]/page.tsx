import { notFound } from "next/navigation";
import { TemplateEditor } from "@/components/admin/template-editor";
import { findTemplateById } from "@/lib/models/template";
import { listCatalogItems } from "@/lib/models/catalog-item";

export const metadata = { title: "編輯模板" };

export default async function TemplateEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [template, items] = await Promise.all([findTemplateById(id), listCatalogItems()]);
  if (!template) notFound();

  return <TemplateEditor template={template} items={items.filter((it) => it.active)} />;
}
