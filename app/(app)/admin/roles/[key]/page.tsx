import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Section, Button, ButtonLink } from "@/components/ui/primitives";
import { GroupForm } from "@/components/admin/group-form";
import { memberGroupByKey, membersInGroup } from "@/lib/mock";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ key: string }>;
}): Promise<Metadata> {
  const { key } = await params;
  const group = memberGroupByKey(key);
  return { title: group ? `編輯權限：${group.name}` : "編輯權限" };
}

export default async function EditGroupPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  const group = memberGroupByKey(key);
  if (!group) notFound();

  const memberCount = membersInGroup(group.name);

  return (
    <Section
      title={`編輯權限：${group.name}`}
      description={`目前有 ${memberCount} 位會員套用這個組別；調整後，套用這個組別的會員會一起套用新設定。`}
      actions={
        <ButtonLink href="/admin/roles" variant="ghost">
          返回列表
        </ButtonLink>
      }
    >
      <GroupForm group={group} />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <Button variant="danger">刪除組別</Button>
        <div className="flex gap-2">
          <ButtonLink href="/admin/roles" variant="ghost">
            取消
          </ButtonLink>
          <Button>儲存</Button>
        </div>
      </div>

      <p className="mt-3 text-xs text-muted">＊此頁為介面預覽，表單尚未串接後端。</p>
    </Section>
  );
}
