import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Section, Button, ButtonLink } from "@/components/ui/primitives";
import { MemberForm } from "@/components/admin/member-form";
import { memberById } from "@/lib/mock";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const member = memberById(id);
  return { title: member ? `編輯會員：${member.name}` : "編輯會員" };
}

export default async function EditMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const member = memberById(id);
  if (!member) notFound();

  return (
    <Section
      title={`編輯會員：${member.name}`}
      description="改權限或狀態會立即影響該會員可操作的範圍。"
      actions={
        <ButtonLink href="/admin/members" variant="ghost">
          返回列表
        </ButtonLink>
      }
    >
      <MemberForm member={member} />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <Button variant="danger">刪除會員</Button>
        <div className="flex gap-2">
          <ButtonLink href="/admin/members" variant="ghost">
            取消
          </ButtonLink>
          <Button>儲存</Button>
        </div>
      </div>

      <p className="mt-3 text-xs text-muted">＊此頁為介面預覽，表單尚未串接後端。</p>
    </Section>
  );
}
