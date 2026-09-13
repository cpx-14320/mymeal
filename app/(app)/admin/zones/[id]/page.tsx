import { notFound } from "next/navigation";
import { Section, Button, ButtonLink } from "@/components/ui/primitives";
import { ZoneForm } from "@/components/admin/zone-form";
import { zoneById } from "@/lib/mock";

export const metadata = { title: "編輯專區" };

export default async function EditZonePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const zone = zoneById(id);
  if (!zone) notFound();

  return (
    <Section
      title={`編輯專區：${zone.name}`}
      description={`前台網址 /z/${zone.slug}`}
      actions={
        <ButtonLink href="/admin/zones" variant="ghost">
          返回列表
        </ButtonLink>
      }
    >
      <ZoneForm zone={zone} />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <Button variant="danger">刪除專區</Button>
        <div className="flex gap-2">
          <ButtonLink href="/admin/zones" variant="ghost">
            取消
          </ButtonLink>
          <Button>儲存</Button>
        </div>
      </div>

      <p className="mt-3 text-xs text-muted">＊此頁為介面預覽，表單尚未串接後端。</p>
    </Section>
  );
}
