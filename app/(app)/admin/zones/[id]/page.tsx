import { notFound } from "next/navigation";
import { Section } from "@/components/ui/primitives";
import { ZoneForm } from "@/components/admin/zone-form";
import { findOrderZoneById } from "@/lib/models/order-zone";
import { listTemplates } from "@/lib/models/template";

export const metadata = { title: "編輯專區" };

export default async function EditZonePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [zone, templates] = await Promise.all([findOrderZoneById(id), listTemplates()]);
  if (!zone) notFound();

  return (
    <Section
      title={`編輯專區：${zone.name}`}
      description={`前台網址 /z/${zone.slug}`}
    >
      <ZoneForm zone={zone} templates={templates} />
    </Section>
  );
}
