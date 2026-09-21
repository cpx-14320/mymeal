import { Section, ButtonLink } from "@/components/ui/primitives";
import { AdminHeaderActions } from "@/components/layout/admin-header-actions";
import { ZonesList } from "@/components/admin/zones-list";
import { listOrderZones } from "@/lib/models/order-zone";
import { listTemplates } from "@/lib/models/template";

export const metadata = { title: "訂餐專區" };

export default async function AdminZonesPage() {
  const [zones, templates] = await Promise.all([listOrderZones(), listTemplates()]);
  const templateNameById = Object.fromEntries(templates.map((t) => [t.id, t.name]));

  return (
    <Section>
      <AdminHeaderActions>
        <ButtonLink href="/admin/zones/new">新增專區</ButtonLink>
      </AdminHeaderActions>

      <ZonesList zones={zones} templateNameById={templateNameById} />
    </Section>
  );
}
