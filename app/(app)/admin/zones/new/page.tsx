import { Section, Button, ButtonLink } from "@/components/ui/primitives";
import { ZoneForm } from "@/components/admin/zone-form";

export const metadata = { title: "新增專區" };

export default function NewZonePage() {
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
      <ZoneForm />

      <div className="mt-4 flex justify-end gap-2">
        <ButtonLink href="/admin/zones" variant="ghost">
          取消
        </ButtonLink>
        <Button>建立專區</Button>
      </div>

      <p className="mt-3 text-xs text-muted">＊此頁為介面預覽，表單尚未串接後端。</p>
    </Section>
  );
}
