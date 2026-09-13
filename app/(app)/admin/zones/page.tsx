import { Section, ButtonLink, Note } from "@/components/ui/primitives";
import { ZonesList } from "@/components/admin/zones-list";

export const metadata = { title: "訂餐專區" };

export default function AdminZonesPage() {
  return (
    <Section
      title="訂餐專區"
      description="前台的訂餐分頁。每個專區套用一到多個模板，使用者進專區選模板開團。"
      actions={<ButtonLink href="/admin/zones/new">新增專區</ButtonLink>}
    >
      <Note>
        層級：訂餐專區 → 模板（可多個、可與其他專區共用）→ 分類 → 品項。
      </Note>

      <div className="mt-4">
        <ZonesList />
      </div>

      <p className="mt-4 text-xs text-muted">
        ＊此頁為介面預覽，資料為範例。開團流程之後會加「先選專區」一步。
      </p>
    </Section>
  );
}
