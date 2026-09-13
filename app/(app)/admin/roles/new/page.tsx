import { Section, Button, ButtonLink } from "@/components/ui/primitives";
import { GroupForm } from "@/components/admin/group-form";

export const metadata = { title: "新增組別" };

export default function NewGroupPage() {
  return (
    <Section
      title="新增組別"
      description="建立後即可指派給會員，多個會員可以套用同一個組別。"
      actions={
        <ButtonLink href="/admin/roles" variant="ghost">
          返回列表
        </ButtonLink>
      }
    >
      <GroupForm />

      <div className="mt-4 flex justify-end gap-2">
        <ButtonLink href="/admin/roles" variant="ghost">
          取消
        </ButtonLink>
        <Button>建立組別</Button>
      </div>

      <p className="mt-3 text-xs text-muted">＊此頁為介面預覽，表單尚未串接後端。</p>
    </Section>
  );
}
