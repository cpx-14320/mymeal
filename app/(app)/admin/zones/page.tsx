import { Section, ButtonLink, Note } from "@/components/ui/primitives";
import { ZonesList } from "@/components/admin/zones-list";
import { listOrderZones } from "@/lib/models/order-zone";
import { listTemplates } from "@/lib/models/template";

export const metadata = { title: "訂餐專區" };

export default async function AdminZonesPage() {
  const [zones, templates] = await Promise.all([listOrderZones(), listTemplates()]);
  const templateNameById = Object.fromEntries(templates.map((t) => [t.id, t.name]));

  return (
    <Section
      title="訂餐專區"
      description="前台的訂餐分頁。每個專區套用一到多個模板，使用者進專區選模板開團。"
      actions={<ButtonLink href="/admin/zones/new">新增專區</ButtonLink>}
    >
      <Note>層級：訂餐專區 → 模板（可多個、可與其他專區共用）→ 分類 → 品項。</Note>

      <div className="mt-4">
        <ZonesList zones={zones} templateNameById={templateNameById} />
      </div>
    </Section>
  );
}
