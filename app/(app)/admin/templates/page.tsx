import { TemplatesList } from "@/components/admin/templates-list";
import { listTemplates } from "@/lib/models/template";

export const metadata = { title: "模板設定" };

export default async function AdminTemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const [templates, params] = await Promise.all([
    listTemplates({ withCreatorLabels: true }),
    searchParams,
  ]);

  return <TemplatesList templates={templates} justCreated={params.created === "1"} />;
}
