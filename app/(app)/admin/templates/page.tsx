import { TemplatesList } from "@/components/admin/templates-list";
import { listTemplates } from "@/lib/models/template";

export const metadata = { title: "模板" };

export default async function AdminTemplatesPage() {
  const templates = await listTemplates();

  return <TemplatesList templates={templates} />;
}
