import { Section, Button, ButtonLink } from "@/components/ui/primitives";
import { MemberForm } from "@/components/admin/member-form";

export const metadata = { title: "新增會員" };

export default function NewMemberPage() {
  return (
    <Section
      title="新增會員"
      description="建立後即可登入使用，權限決定後台可操作的範圍。"
      actions={
        <ButtonLink href="/admin/members" variant="ghost">
          返回列表
        </ButtonLink>
      }
    >
      <MemberForm />

      <div className="mt-4 flex justify-end gap-2">
        <ButtonLink href="/admin/members" variant="ghost">
          取消
        </ButtonLink>
        <Button>建立會員</Button>
      </div>

      <p className="mt-3 text-xs text-muted">＊此頁為介面預覽，表單尚未串接後端。</p>
    </Section>
  );
}
