import { Section } from "@/components/ui/primitives";
import { TemplateCreateForm } from "@/components/admin/template-create-form";

export const metadata = { title: "新增模板" };

export default function NewTemplatePage() {
  return (
    <Section title="新增模板" description="建立一個空模板，建立後可以在編輯頁繼續新增區塊與品項。">
      <TemplateCreateForm />
    </Section>
  );
}
