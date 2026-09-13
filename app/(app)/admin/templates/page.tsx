import { Section, Button } from "@/components/ui/primitives";
import { TemplatesList } from "@/components/admin/templates-list";

export const metadata = { title: "模板" };

export default function AdminTemplatesPage() {
  return (
    <Section
      title="模板"
      description="可重用的訂購藍圖：模板 → 分類 → 品項。開團時選一個模板 + 分類。"
      actions={<Button>新增模板</Button>}
    >
      <TemplatesList />
    </Section>
  );
}
