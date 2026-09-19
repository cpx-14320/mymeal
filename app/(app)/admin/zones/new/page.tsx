import { Section, ButtonLink } from "@/components/ui/primitives";
import { ZoneForm } from "@/components/admin/zone-form";
import { listTemplates } from "@/lib/models/template";

export const metadata = { title: "新增專區" };

export default async function NewZonePage() {
  const templates = await listTemplates();

  return (
    <Section
      title="新增訂餐專區"
      description="建立後，前台會多一個 /z/{slug} 頁面。"
      actions={
        <ButtonLink href="/admin/zones" variant="ghost">
          返回列表
        </ButtonLink>
      }
    >
      <ZoneForm templates={templates} />
    </Section>
  );
}
